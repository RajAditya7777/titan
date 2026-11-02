import type { DocContent } from "../schema";

const SOT = "/titan/docs/developer-doc/special-order-types";
const SLO = "/titan/docs/developer-doc/searchers-limit-orders";

const PRICE_CODE = `impl LimitOrder {
    /// Cost and fee for taking \`amount\` input tokens.
    pub fn calculate_costs_and_fee(
        &self,
        amount: u64,
        fee_ticks: u8,
    ) -> Result<(u64, u64), ProgramError> {
        let amount_u128 = amount as u128;
        let price_base = self.price_base as u128;
        let price_exponent = 10u128.pow(self.price_exponent as u32);
        let fee_units_u128 = (fee_ticks as u16).saturating_mul(FEE_TICK_UNITS as u16) as u128;

        // Ceiling division: (a + b - 1) / b
        let cost_u128 = amount_u128
            .saturating_mul(price_base)
            .checked_add(price_exponent.saturating_sub(1))
            .ok_or(ProgramError::ArithmeticOverflow)?
            .saturating_div(price_exponent);
        let cost: u64 = cost_u128
            .try_into()
            .map_err(|_| ProgramError::ArithmeticOverflow)?;

        let fees: u64 = cost_u128
            .saturating_mul(fee_units_u128)
            .saturating_div(FEE_TICK_DIVISOR)
            .try_into()
            .map_err(|_| ProgramError::ArithmeticOverflow)?;

        Ok((cost, fees.max(1)))
    }

    /// Input amount still unfilled.
    pub fn get_remaining_amount(&self) -> u64 {
        self.amount.saturating_sub(self.amount_filled)
    }
}`;

const TAKE_CODE = `/// Fees go to this address
pub const FEE_RECEIVER_ADDRESS: Pubkey = pubkey!("Bq5ZzfiU3vTiJPrBJFcr98BnUy9Wc1dg9ASeycB2tX1C");

pub fn get_vault_manager_address_and_bump_seed() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"vault_manager"], &TITAN_LIMIT_ORDER_PROGRAM_ID)
}

pub fn get_associated_token_address_and_bump_seed(
    wallet_address: &Pubkey,
    token_mint_address: &Pubkey,
    token_program: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            &wallet_address.to_bytes(),
            &token_program.to_bytes(),
            &token_mint_address.to_bytes(),
        ],
        &ASSOCIATED_TOKEN_PROGRAM_ID,
    )
}

/// Builds the instructions that create a seeded (non-ATA) token account.
pub fn create_token_account_with_seed_instructions(
    payer: &Pubkey,
    authority: &Pubkey,
    mint: &Pubkey,
    seed: &str,
    owner: &Pubkey,
) -> Result<(Pubkey, Vec<Instruction>), TitanSDKError> {
    let token_account = Pubkey::create_with_seed(payer, seed, owner)
        .map_err(|_| TitanSDKError::FailedToCreateInstruction)?;

    let token_account_space = spl_token::state::Account::LEN;
    let lamports = 2039280u64; // rent-exempt minimum

    let create_account_ix = create_account_with_seed(
        payer,
        &token_account,
        payer,
        seed,
        lamports,
        token_account_space as u64,
        owner,
    );
    let init_account_ix = initialize_account(&spl_token::id(), &token_account, mint, authority)
        .map_err(|_| TitanSDKError::FailedToCreateInstruction)?;

    Ok((token_account, vec![create_account_ix, init_account_ix]))
}

mod TakeOrder {
    pub const DISCRIMINATOR: u8 = 2;
}

pub struct InstructionBundle {
    /// Run before the main instruction.
    pub setup: Vec<Instruction>,
    /// The TakeOrder instruction itself.
    pub instruction: Instruction,
    /// Run after the main instruction.
    pub cleanup: Vec<Instruction>,
}

pub fn create_take_order_instruction(
    taker: Pubkey,
    taker_input_mint_token_account: Pubkey,
    taker_output_mint_token_account: Pubkey,
    limit_order: &LimitOrder,
    amount: u64,
    max_cost_limit: Option<u64>, // the instruction fails if cost exceeds this
    input_mint_program: Pubkey,  // spl or spl-2022
    output_mint_program: Pubkey, // spl or spl-2022
) -> Result<InstructionBundle> {
    let time_in_force = TimeInForce::try_from(limit_order.time_in_force)?;
    let max_cost_limit = max_cost_limit.unwrap_or(u64::MAX);

    let remaining_balance_left = amount != limit_order.get_remaining_amount();
    let order_will_close = !remaining_balance_left
        || time_in_force == TimeInForce::ImmediateOrCancel
        || time_in_force == TimeInForce::TakeCancelsOrder;

    let fee_ticks = limit_order.fee_ticks;
    let (cost, fee) = limit_order.calculate_costs_and_fee(amount, fee_ticks)?;

    let output_is_wsol = limit_order.output_mint.eq(&WRAPPED_SOL);
    let input_is_wsol = limit_order.input_mint.eq(&WRAPPED_SOL);

    let limit_order_address = derive_limit_order_address(limit_order);
    let (vault_manager_address, _) = get_vault_manager_address_and_bump_seed();

    let maker = Pubkey::new_from_array(limit_order.maker);
    let input_mint = Pubkey::new_from_array(limit_order.input_mint);
    let output_mint = Pubkey::new_from_array(limit_order.output_mint);

    // The fee receiver needs an output-mint ATA.
    let mut setup = vec![create_associated_token_account_idempotent(
        &taker,
        &Pubkey::new_from_array(FEE_RECEIVER_ADDRESS),
        &output_mint,
        &output_mint_program,
    )];
    let mut cleanup = vec![];

    if output_is_wsol {
        // Wrap SOL into the taker's WSOL ATA before the take, close it after.
        let wsol_ata = get_associated_token_address_with_program_id(
            &taker,
            &output_mint,
            &output_mint_program,
        );
        setup.extend_from_slice(&[
            create_associated_token_account_idempotent(&taker, &taker, &output_mint, &output_mint_program),
            transfer(&taker, &wsol_ata, cost.saturating_add(fee)),
            sync_native(&output_mint_program, &wsol_ata)?,
        ]);
        cleanup.push(close_account(&output_mint_program, &wsol_ata, &taker, &taker, &[])?);
    }

    let (output_mint_token_account_address, output_mint_token_account_bump) =
        if order_will_close && output_is_wsol {
            // Special case: seeded WSOL account, closed to the maker.
            let (pk, ixs) = create_token_account_with_seed_instructions(
                &taker, &taker, &output_mint, "token_seed", &output_mint_program,
            )?;
            setup.extend(ixs);
            (pk, 0) // bump unused here
        } else {
            // Otherwise the maker's output ATA.
            get_associated_token_address_and_bump_seed(&maker, &output_mint, &output_mint_program)
        };

    let (input_mint_token_account_address, input_mint_token_account_bump) =
        if order_will_close && remaining_balance_left && input_is_wsol {
            let (pk, ixs) = create_token_account_with_seed_instructions(
                &taker, &taker, &input_mint, "token_seed", &input_mint_program,
            )?;
            setup.extend(ixs);
            (pk, 0)
        } else {
            get_associated_token_address_and_bump_seed(&maker, &input_mint, &input_mint_program)
        };

    let (input_mint_vault_address, _) = get_associated_token_address_and_bump_seed(
        &vault_manager_address, &input_mint, &input_mint_program,
    );
    let (output_mint_vault_address, _) = get_associated_token_address_and_bump_seed(
        &vault_manager_address, &output_mint, &output_mint_program,
    );

    // Make sure the vault manager has an output-mint account.
    setup.push(create_associated_token_account_idempotent(
        &taker, &vault_manager_address, &output_mint, &output_mint_program,
    ));

    let fee_receiver = Pubkey::new_from_array(FEE_RECEIVER_ADDRESS);
    let (fee_receiver_output_mint_token_account, fee_receiver_output_mint_bump) =
        get_associated_token_address_and_bump_seed(&fee_receiver, &output_mint, &output_mint_program);

    let mut data = vec![instructions::TakeOrder::DISCRIMINATOR];
    data.extend_from_slice(&amount.to_le_bytes());
    data.extend_from_slice(&max_cost_limit.to_le_bytes());
    data.extend_from_slice(&[
        output_mint_token_account_bump,
        input_mint_token_account_bump,
        fee_receiver_output_mint_bump,
    ]);

    let accounts = vec![
        AccountMeta::new(taker, true),
        AccountMeta::new(maker, false),
        AccountMeta::new_readonly(input_mint, false),
        AccountMeta::new_readonly(output_mint, false),
        AccountMeta::new(limit_order_address, false),
        AccountMeta::new(taker_input_mint_token_account, false),
        AccountMeta::new(taker_output_mint_token_account, false),
        AccountMeta::new(output_mint_token_account_address, false),
        AccountMeta::new(input_mint_token_account_address, false),
        AccountMeta::new(fee_receiver_output_mint_token_account, false),
        AccountMeta::new_readonly(vault_manager_address, false),
        AccountMeta::new(input_mint_vault_address, false),
        AccountMeta::new(output_mint_vault_address, false),
        AccountMeta::new_readonly(solana_program::system_program::ID, false),
        AccountMeta::new_readonly(input_mint_program, false),
        AccountMeta::new_readonly(output_mint_program, false),
        AccountMeta::new_readonly(ASSOCIATED_TOKEN_PROGRAM_ID, false),
        AccountMeta::new_readonly(solana_program::sysvar::instructions::ID, false),
    ];

    Ok(InstructionBundle {
        setup,
        instruction: Instruction { program_id: TITAN_LIMIT_ORDER_PROGRAM_ID, accounts, data },
        cleanup,
    })
}`;

/** Page bodies for this section, keyed by slug. Own words; facts exact. */
export const PAGES: Record<string, DocContent> = {
  "special-order-types/overview": {
    lead: "Server-to-server DCA, stop-loss, take-profit, OCO and Slice Orders on Solana, built on Titan-managed wallets.",
    blocks: [
      { t: "p", text: "Titan lets your product offer scheduled and price-triggered orders on Solana, with no need to hold user keys, operate a price monitor, or build swap plumbing. Your backend makes the calls. For each user Titan sets up a managed wallet, carries out each order when its time or price condition is met, and delivers the swapped tokens to that user's own wallet." },
      { t: "p", text: "One integration covers all five order types:" },
      {
        t: "table",
        head: ["`orderType`", "What it does"],
        rows: [
          [`[\`dca\`](${SOT}/order-types/dca)`, "Spends a fixed amount on a schedule until the total is used up"],
          [`[\`stop_loss\`](${SOT}/order-types/stop-loss-take-profit)`, "Sells the full deposit when the price falls to a trigger"],
          [`[\`take_profit\`](${SOT}/order-types/stop-loss-take-profit)`, "Sells the full deposit when the price rises to a trigger"],
          [`[\`oco\`](${SOT}/order-types/oco)`, "One deposit with a floor and a ceiling; whichever fills first cancels the other"],
          [`[\`slice\`](${SOT}/order-types/slice)`, "Swaps one deposit as a series of smaller back-to-back swaps to lower price impact"],
        ],
      },
      { t: "p", text: `Stop-loss, take-profit and Slice Orders can optionally attach a [take-profit / stop-loss bracket](${SOT}/order-types/otoco) that is created automatically for the tokens the order purchases.` },
      { t: "p", text: "Nothing about the plumbing varies by type: the key, the onboarding step, the two-step transaction flow and the endpoints are all common. Once you support DCA, supporting stop-loss only requires a different `config` shape rather than fresh integration work." },
      { t: "p", text: "This is a **server-to-server** integration, so there is no frontend SDK to add and no new login screen. Users keep signing in as they do now. A single API key authenticates your backend to Titan, and each user is identified by the persistent id you already keep for them." },
      { t: "h2", text: "How the pieces fit" },
      { t: "p", text: "Your backend holds a partner **API key** (`X-Titan-Key`) and attaches it to each request. Calls about a particular user additionally carry `X-Titan-User`, which is your id for that person. Titan validates the key, ties the request to your tenant, looks the user up, and executes the order from that user's Titan-managed Solana wallet." },
      { t: "code", lang: "text", code: "your backend ──(X-Titan-Key + X-Titan-User)──▶  Titan  ──▶  user's manager (policy-bound)\n       │\n       └─ once per user: POST /partner/onboard  (X-Titan-Key + user's SIWS)  ──▶  provisions the manager" },
      { t: "p", text: "Only one cryptographic proof is required in the entire flow: a **Sign-In-with-Solana (SIWS)** signature that the user produces a single time during onboarding. OAuth, token exchange and partner-issued JWTs are not involved." },
      { t: "h2", text: "Core concepts" },
      {
        t: "table",
        head: ["Concept", "What it means for you"],
        rows: [
          ["**Tenant**", "Your partner account inside Titan. Every order, execution and row carries your tenant id, so your data stays separate from other partners'."],
          ["**Partner API key** (`X-Titan-Key`)", "A server-side secret issued by Titan. Send it on every request and never ship it to a browser."],
          ["**Partner user id** (`X-Titan-User`)", "Your stable id for an end user. You pass it as `sub` at onboarding and as `X-Titan-User` on every user-scoped call. It is scoped to your tenant, so two partners can reuse the same id without clashing."],
          ["**Manager**", "A Solana wallet that Titan creates and operates but the user owns. Titan only signs what the user's policy allows: order-execution swaps (DCA cycles, trigger fills and slices) and withdrawals back to the user's own external wallet."],
          ["**External wallet** (`userPubkey`)", "The user's existing Solana wallet. It pays network fees on user-signed transactions and, by default, receives swap output. Ownership is proven once, at onboarding, through SIWS."],
          ["**Two-step transactions**", "Anything that changes on-chain state takes two calls: **intent** (Titan returns an unsigned transaction), the user signs, then **confirm** (you return the signed transaction; Titan co-signs and broadcasts)."],
          ["**Trigger order**", "A one-shot order (`stop_loss`, `take_profit` or `oco`) that watches a price, either the pair ratio or the input token's USD price depending on `priceBasis`, and swaps its whole deposit once a trigger is crossed. It is created on the same endpoints as DCA."],
          ["**Slice Order**", "One deposit swapped as back-to-back smaller swaps, each quoted only after the previous one confirms, to reduce price impact."],
          ["**Automatic input return**", "If an order fails permanently, or a trigger order expires, Titan sends the remaining unspent input to the user's external wallet. No partner action or user signature is needed, and funds reserved for the user's other active orders are not touched."],
        ],
      },
      { t: "p", text: "A manager belongs to the end user globally, not to a single partner. When the same person shows up through a different integrator using the same external wallet, they are mapped to the **same** Titan-managed manager, and their balances and active orders carry over." },
      { t: "h2", text: "Environments" },
      {
        t: "table",
        head: ["Environment", "Base URL", "Notes"],
        rows: [["Production", "`https://api.chronos.titan.exchange/api/v1`", "Issued at onboarding."]],
      },
      { t: "p", text: "You also receive a separate **development** base URL at onboarding, for end-to-end testing ahead of launch. A given key is valid in exactly one environment. Throughout this section, endpoint paths are written relative to the base URL." },
      { t: "h2", text: "Where to go next" },
      { t: "p", text: `The [Quickstart](${SOT}/quickstart) takes you from onboarding a user through to placing a first order. For a description of each type and its \`config\`, see [Order Types](${SOT}/order-types). Shared behaviour is documented in the [Guides](${SOT}/guides): [Onboarding](${SOT}/guides/onboarding), [Creating Orders](${SOT}/guides/creating-orders), [Managing Orders](${SOT}/guides/managing-orders), [Withdrawals](${SOT}/guides/withdrawals), [Platform Fees](${SOT}/guides/platform-fees) and [Lifecycle & Polling](${SOT}/guides/lifecycle). When you need precise definitions, turn to [Authentication](${SOT}/reference/authentication) and the complete [Endpoints](${SOT}/reference/endpoints) reference.` },
    ],
  },

  "special-order-types/quickstart": {
    lead: "Onboard a user and create your first order in four steps.",
    blocks: [
      { t: "p", text: "The full journey is to onboard a user one time and then place an order through the intent/confirm pair of calls. All of it is run by your backend with your `X-Titan-Key`. The sample places a `dca` order; to place a stop-loss, take-profit or OCO instead, just swap in a different `orderType` and `config`." },
      { t: "callout", tone: "info", text: "You need your partner **API key** and your environment's **base URL**, both issued at onboarding. Keep the key in your backend's secret store and never expose it to a browser." },
      {
        t: "steps",
        items: [
          { title: "Set your credentials", body: "Export the key and base URL as environment variables, then add a small helper for user-scoped calls. Note that it sends `X-Titan-User`, not a bearer token.\n\n(see code below)" },
          { title: "Onboard the user (once)", body: "Have the user sign a canonical SIWS message from their external wallet, then submit it. Titan responds by provisioning their managed wallet and saving the external wallet as the address used for funding and withdrawals. Calling it again with identical inputs is safe and gives back the same result. The `User:` line has to match the `sub` you use in later calls, and the `Address:` line has to match the wallet pubkey. [Onboarding](" + SOT + "/guides/onboarding) specifies the message format and how recent it must be." },
          { title: "Create an order and get an unsigned deposit transaction", body: "The order is funded from the user's external wallet, so creation takes two calls. First, `intent` returns an unsigned deposit transaction. The user signs it with their external wallet within 5 minutes. Titan sponsors the network fees for recurring cycle executions, so the manager never needs SOL to keep running." },
          { title: "Confirm with the signed transaction", body: "Return the signed transaction. Titan adds its co-signature, sends it to Solana and switches the order on. After that each cycle runs on schedule without further action on your side. A trigger order behaves differently: it is `active` right away and starts monitoring the pair's price." },
        ],
      },
      { t: "p", text: "Code for the four steps above, in order:" },
      {
        t: "codeTabs",
        tabs: [
          {
            label: "1. Credentials",
            code: `export TITAN_DCA_API_KEY="<your-partner-api-key>"
export TITAN_DCA_BASE_URL="https://api.chronos.titan.exchange/api/v1"`,
          },
          {
            label: "1. Helper",
            code: `async function callTitanDca(path: string, opts: {
  method?: string;
  body?: unknown;
  sub: string; // your stable user id == X-Titan-User
}) {
  const res = await fetch(process.env.TITAN_DCA_BASE_URL + path, {
    method: opts.method ?? "GET",
    headers: {
      "X-Titan-Key": process.env.TITAN_DCA_API_KEY!,
      "X-Titan-User": opts.sub,
      "Content-Type": "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}`,
          },
          {
            label: "2. Onboard",
            code: `const message =
  "Titan DCA wants you to link this Solana wallet.\\n\\n" +
  "Address: " + userPubkey + "\\n" +
  "User: " + sub + "\\n" +
  "Issued At: " + new Date().toISOString() + "\\n" +
  "Nonce: " + crypto.randomUUID() + "\\n";

// The user's wallet signs \`message\` in your frontend; you send the signature here.
const res = await fetch(process.env.TITAN_DCA_BASE_URL + "/partner/onboard", {
  method: "POST",
  headers: {
    "X-Titan-Key": process.env.TITAN_DCA_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sub,
    userPubkey,
    siws: { message, signature: signatureBase58 },
  }),
});

const { data } = await res.json();
// Keep data.userId: you will use it in /partners/me/* reporting filters.`,
          },
          {
            label: "3. Intent",
            code: `const intent = await callTitanDca("/orders/intent", {
  method: "POST",
  sub,
  body: {
    orderType: "dca",
    userPubkey,
    config: {
      inputMint: "So11111111111111111111111111111111111111112", // SOL
      outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
      totalAmount: "1000000000", // 1 SOL total, in lamports
      amountPerCycle: "100000000", // 0.1 SOL per cycle
      cycleFrequencySeconds: 86400, // daily
    },
  },
});

const { pendingOrderId, transaction } = intent.data; // transaction: base64, unsigned`,
          },
          {
            label: "4. Confirm",
            code: `const confirmed = await callTitanDca("/orders/confirm", {
  method: "POST",
  sub,
  body: {
    pendingOrderId,
    signedTransaction, // base64, signed by the user's external wallet
  },
});

const { order, txSignature } = confirmed.data;`,
          },
        ],
      },
      { t: "h2", text: "What success looks like" },
      { t: "p", text: "Once `confirm` returns, the order is `active`:" },
      { t: "code", lang: "json", code: `{
  "success": true,
  "data": {
    "order": { "id": "9b3f1ad0-…", "status": "active", "orderType": "dca", "...": "…" },
    "txSignature": "5Uq…",
    "pendingOrderId": "9b3f1ad0-…"
  }
}` },
      { t: "h2", text: "Manage it" },
      { t: "code", lang: "typescript", code: `await callTitanDca("/me/orders/active", { sub }); // list running orders
await callTitanDca("/dca/" + orderId, { sub }); // one DCA order with progress
await callTitanDca("/orders/" + orderId + "/pause", { method: "POST", sub });
await callTitanDca("/orders/" + orderId + "/resume", { method: "POST", sub });` },
      { t: "p", text: `For tenant-wide reconciliation, use the partner reporting routes with \`X-Titan-Key\` alone; see [Endpoints → Partner reporting](${SOT}/reference/endpoints#partner-reporting).` },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Order Types](${SOT}/order-types): the \`config\` shape of each of DCA, stop-loss, take-profit and OCO`,
          `[Onboarding (SIWS)](${SOT}/guides/onboarding): the canonical message, how fresh it must be, and what errors can occur`,
          `[Creating Orders](${SOT}/guides/creating-orders): the complete two-step flow along with the fields all types share`,
          `[Authentication](${SOT}/reference/authentication): the headers, the request tiers and authentication errors`,
        ],
      },
    ],
  },

  "special-order-types/order-types": {
    lead: "The five order types you can create, the conditional-entry option, and how to pick between them.",
    blocks: [
      { t: "p", text: "Every order type runs on the same integration: one API key, one onboarding, one two-step transaction flow, one set of endpoints. Only `orderType` and the `config` object differ. If DCA works, adding stop-loss is a new `config` shape rather than a new integration." },
      { t: "h2", text: "What's available" },
      {
        t: "table",
        head: ["`orderType`", "Shape", "Fires"],
        rows: [
          [`[\`dca\`](${SOT}/order-types/dca)`, "Recurring: spends `amountPerCycle` on a fixed schedule until `totalAmount` runs out", "On a clock, every `cycleFrequencySeconds`"],
          [`[\`stop_loss\`](${SOT}/order-types/stop-loss-take-profit)`, "One-shot: sells the whole deposit", "When the watched price **falls** to `triggerPrice`"],
          [`[\`take_profit\`](${SOT}/order-types/stop-loss-take-profit)`, "One-shot: sells the whole deposit", "When the watched price **rises** to `triggerPrice`"],
          [`[\`oco\`](${SOT}/order-types/oco)`, "One-shot with one deposit and two triggers; the first to fire cancels the other", "At either `takeProfitPrice` or `stopLossPrice`"],
          [`[\`slice\`](${SOT}/order-types/slice)`, "One deposit swapped as `executions` smaller back-to-back swaps, each quoted after the previous one confirms", "Right after confirm, slice by slice"],
        ],
      },
      { t: "p", text: `**Trigger orders** is the collective name for stop-loss, take-profit and OCO. Each one puts its entire \`amount\` in at creation, tracks a price (either the pair ratio or the input token's USD price, chosen by [\`priceBasis\`](${SOT}/order-types/stop-loss-take-profit#price-basis)), and performs a single swap. Adding \`trailingStopBps\` makes any of them [trailing](${SOT}/order-types/trailing), which lets the trigger move along with the market rather than sit at a fixed level.` },
      { t: "p", text: `You can attach [\`onFillOco\`](${SOT}/order-types/otoco) to a \`stop_loss\`, \`take_profit\` or \`slice\` order. Once the order fills, Titan sets up a take-profit / stop-loss bracket on the purchased tokens without any extra call.` },
      { t: "h2", text: "Choosing between them" },
      {
        t: "table",
        head: ["User intent", "Order type"],
        rows: [
          ["Average into or out of a position over time, with no specific price", "`dca`"],
          ["A single exit at one price", "`stop_loss` or `take_profit`"],
          ["A floor and a ceiling on one position, with one deposit", "`oco`"],
          ["Protect gains without capping them", `\`stop_loss\` or \`take_profit\` with [trailing](${SOT}/order-types/trailing)`],
          ["Swap a large size now with less price impact", "`slice`"],
          ["Buy on a condition, then bracket the position automatically", `\`stop_loss\`, \`take_profit\` or \`slice\` with [\`onFillOco\`](${SOT}/order-types/otoco)`],
        ],
      },
      { t: "h2", text: "What differs per type" },
      { t: "p", text: `The remaining pieces are the same for every type, so one implementation serves all: authentication, [onboarding](${SOT}/guides/onboarding) (with \`onboardIfNeeded\` and its \`409\` fallback), the \`intent → sign → confirm\` sequence, the response envelope, balances, [withdrawals](${SOT}/guides/withdrawals), idempotency, and [platform fees](${SOT}/guides/platform-fees).` },
      { t: "p", text: "The real differences are these:" },
      {
        t: "table",
        head: ["", "`dca`", "Trigger orders", "`slice`"],
        rows: [
          ["Status after `confirm`", "`active`, or `pending` when `config.startAt` is in the future", "`active`, always", "`active`, then `executing` for the whole run"],
          ["Executions", "One row per cycle", "Exactly one row, when it fires", "One `slice_fill` row per confirmed slice"],
          ["Modify", "`PATCH /dca/{orderId}`", `Parameter-only \`PATCH\` per type; see [Modify a trigger order](${SOT}/guides/managing-orders#modify-a-trigger-order)`, "Not supported"],
          ["Pause, resume, cancel", "Supported", "Supported", "Not supported"],
          ["Retry a `failed` order", "Supported, within a short window", "Not supported (`400 RETRY_NOT_SUPPORTED`)", "Not supported (`400 RETRY_NOT_SUPPORTED`)"],
          ["`expired` orders", "Withdraw manually", "Deposit is returned automatically", "No expiry"],
          ["Minimum notional", "Applies to `amountPerCycle`", "Applies to the full `amount`", "Applies per slice (`amount / executions`)"],
          ["Concurrency", "Unlimited", "Unlimited", "Per-partner cap per user (default 1)"],
          ["Detail endpoint", "`GET /dca/{orderId}`", "`GET /stop-loss/{orderId}`, `/take-profit/{orderId}`, `/oco/{orderId}`", "`GET /slice/{orderId}`"],
        ],
      },
      { t: "callout", tone: "warning", text: "A per-type detail endpoint returns `404 NOT_FOUND` when the id exists but belongs to a **different** `orderType`. Read the `orderType` field from `GET /me/orders` and route on that instead of trying endpoints until one answers." },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Creating Orders](${SOT}/guides/creating-orders): the intent and confirm calls common to all types`,
          `[Managing Orders](${SOT}/guides/managing-orders): changing, pausing, resuming, cancelling and retrying orders`,
          `[Endpoints](${SOT}/reference/endpoints): every route in detail`,
        ],
      },
    ],
  },

  "special-order-types/guides": {
    lead: "Task-oriented guides for the parts of the integration every order type shares.",
    blocks: [
      { t: "p", text: "**The behaviour described in these guides is identical for DCA, stop-loss, take-profit and OCO orders, which means a single implementation handles every type.** Before starting, complete the [Quickstart](" + SOT + "/quickstart) and have at least one user onboarded. Differences between the types are covered in [Order Types](" + SOT + "/order-types)." },
    ],
  },

  "special-order-types/reference": {
    lead: "The complete contract — auth, endpoints, schema, errors, and limits.",
    blocks: [
      { t: "p", text: "**Here you will find the precise definitions of each route, object and error code that apply to all five order types.** Read [Authentication](" + SOT + "/reference/authentication) first to understand the headers, and then [Endpoints](" + SOT + "/reference/endpoints) for the routes." },
    ],
  },

  "searchers-limit-orders/overview": {
    lead: "On-chain limit orders with partial fills, searcher execution, and configurable time-in-force.",
    blocks: [
      { t: "p", text: "**Titan's Limit Orders are built for a competitive setting in which searchers do the executing.** As a searcher you get access to a marketplace of on-chain limit orders." },
      { t: "p", text: "Orders rest on-chain and can be filled in part or in full. **Takers pay the fees**, which are charged in `output_mint` tokens." },
      { t: "p", text: "**Program address:** `TitanLozLMhczcwrioEguG2aAmiATAPXdYpBg3DbeKK`" },
      { t: "divider" },
      { t: "h2", text: "Order structure" },
      { t: "p", text: "Every limit order is stored at a PDA computed from four things: the maker's public key, the input mint, the output mint and an order ID." },
      {
        t: "code",
        lang: "rust",
        code: `use pinocchio::pubkey::{create_program_address, Pubkey};
use bytemuck::{Pod, Zeroable};

/// Limit order structure
#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq, Pod, Zeroable)]
pub struct LimitOrder {
    // The public key of the order's maker
    pub maker: Pubkey,
    // Input mint of the limit order
    pub input_mint: Pubkey,
    // Output mint of the limit order
    pub output_mint: Pubkey,
    // Slot at which the order was created
    pub creation_slot: u64,
    // Slot at which the order expires
    pub expiration_slot: u64,
    // Amount of input tokens to be exchanged
    pub amount: u64,
    // Amount of input tokens filled so far
    pub amount_filled: u64,
    // Amount of output tokens exchanged so far
    pub out_amount_filled: u64,
    // Amount of output tokens the maker has withdrawn
    pub out_amount_withdrawn: u64,
    // Fees paid, in the smallest unit of the from_token mint
    pub fees_paid: u64,
    // Price base, in the smallest unit of the output token
    pub price_base: u64,
    // Price = price_base * 10^(-price_exponent)
    pub price_exponent: u8,
    // Order status
    pub status: u8,
    // Bump seed for the limit order PDA
    pub bump: u8,
    // Distinguishes orders with the same (owner, input_mint, output_mint)
    pub id: u8,
    // Bump seed for the input mint vault PDA
    pub input_mint_vault_bump: u8,
    // Bump seed for the output mint vault PDA
    pub output_mint_vault_bump: u8,
    // Time in force
    pub time_in_force: u8,
    // Fee tick rate charged to takers
    pub fee_ticks: u8,
}`,
      },
      { t: "p", text: "**Seeds used for the PDA:** `[\"order\", maker, input_mint, output_mint, id, bump]`" },
      { t: "p", text: "**Size of the account:** 168 bytes." },
      { t: "h3", text: "PDA derivation" },
      {
        t: "code",
        lang: "rust",
        code: `impl LimitOrder {
    pub const SEEDS: &'static [u8] = b"order";
    pub const LEN: usize = 168;

    /// PDA address of the limit order for a maker, input mint,
    /// output mint, id and bump.
    pub fn get_pda_address(
        maker: &Pubkey,
        input_mint: &Pubkey,
        output_mint: &Pubkey,
        id: u8,
        bump: u8,
    ) -> Result<Pubkey, ProgramError> {
        let b0 = &[id];
        let b1 = &[bump];
        let seeds_with_bump = [
            LimitOrder::SEEDS,
            maker.as_ref(),
            input_mint.as_ref(),
            output_mint.as_ref(),
            b0,
            b1,
        ]
        .to_vec();

        create_program_address(&seeds_with_bump, &crate::ID)
    }
}`,
      },
      { t: "divider" },
      { t: "h2", text: "Price calculation" },
      { t: "p", text: "A price is stored as `price_base * 10^(-price_exponent)`. As an example, a 100 USDC → 1 SOL order uses `price_base = 1` and `price_exponent = 2`, which gives `0.01` output tokens per input token." },
      { t: "code", lang: "rust", code: PRICE_CODE },
      { t: "divider" },
      { t: "h2", text: "Fees" },
      { t: "p", text: "Takers pay fees in the **output token**. The rate lives on the order as `fee_ticks`." },
      { t: "code", lang: "text", code: "fee_units = fee_ticks × 25\nfee = cost × fee_units / 1,000,000" },
      { t: "p", text: "**The fee can never be lower than 1 unit of the output token.**" },
      { t: "code", lang: "rust", code: `/// Fee tick units
pub const FEE_TICK_UNITS: u8 = 25;
/// 1e6 units = 0.0001; converts the fee tick rate to basis points
pub const FEE_TICK_DIVISOR: u128 = 1_000_000;` },
      { t: "p", text: "**Address that receives fees:** `Bq5ZzfiU3vTiJPrBJFcr98BnUy9Wc1dg9ASeycB2tX1C`" },
      { t: "divider" },
      { t: "h2", text: "Time-in-force" },
      { t: "p", text: "Each order has a time-in-force policy that governs how it can be filled." },
      {
        t: "code",
        lang: "rust",
        code: `/// Time in Force (TIF) for limit orders: how long an order stays active
/// and how it may be filled.
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum TimeInForce {
    /// Good until cancelled. Partial takes are allowed.
    GoodTillCancelled = 0,
    /// After any take, the order is closed.
    TakeCancelsOrder = 1,
    /// Takes must fill the order completely.
    AllOrNothing = 2,
    /// Like TakeCancelsOrder, but must be filled when created.
    ImmediateOrCancel = 3,
    /// Like AllOrNothing, but must be filled when created.
    FillOrKill = 4,
}`,
      },
      {
        t: "list",
        items: [
          "**`GoodTillCancelled` (0)**: stays open until fully filled or cancelled. **Partial fills are allowed.**",
          "**`TakeCancelsOrder` (1)**: closes after any take, however much was filled.",
          "**`AllOrNothing` (2)**: each take must fill all of the remaining amount.",
          "**`ImmediateOrCancel` (3)**: same as `TakeCancelsOrder`, but **it must be filled in the same slot it was created.**",
          "**`FillOrKill` (4)**: same as `AllOrNothing`, but **it must be filled in the same slot it was created.**",
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Order status" },
      {
        t: "code",
        lang: "rust",
        code: `/// Status of a limit order: its current state and how it can be used.
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum OrderStatus {
    /// Open; can be partially filled, filled or cancelled
    Open = 0,
    /// Partially filled; can be filled or cancelled
    PartiallyFilled = 1,
    /// Filled; terminal, used for event logging
    Filled = 2,
    /// Cancelled; terminal, used for event logging
    Cancelled = 3,
}`,
      },
      {
        t: "list",
        items: [
          "**`Open` (0)**: can be partly filled, fully filled or cancelled.",
          "**`PartiallyFilled` (1)**: part of the amount has been filled, and the order can still be filled further or cancelled.",
          "**`Filled` (2)**: the whole amount has been filled. **Terminal state.**",
          "**`Cancelled` (3)**: the maker called it off. **Terminal state.**",
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Placing Taker Orders](${SLO}/take-order): the TakeOrder instruction, its accounts, how WSOL is handled, and complete execution code`,
          `[Limit Order Events](${SLO}/events): the shape of each event and how to decode it from program logs`,
          `[Error Codes](${SLO}/error-codes): the errors the program can return`,
        ],
      },
    ],
  },

  "searchers-limit-orders/take-order": {
    lead: "Fill limit orders as a searcher — instruction layout, accounts, WSOL edge cases, and full execution code.",
    blocks: [
      { t: "p", text: "**Searchers fill orders by calling the `TakeOrder` instruction (discriminator `2`).** An order can be filled in part or in full, and either way the taker gets their tokens right away." },
      { t: "divider" },
      { t: "h2", text: "Fill behavior" },
      { t: "h3", text: "Full fill" },
      { t: "p", text: "When a take completes an order, the program automatically:" },
      {
        t: "list",
        ordered: true,
        items: [
          "**Creates the maker's ATA** for the output tokens, if one is needed.",
          "**Refunds the rent** originally paid for the Limit Order to the maker.",
          "**Reimburses the taker's lamports** if they paid to create any ATA.",
          "**For WSOL output**, pays the maker in SOL rather than WSOL.",
        ],
      },
      { t: "h3", text: "Partial fill" },
      { t: "p", text: "On a partial fill the taker still gets their tokens immediately. The unfilled input stays in the program vault, and **the maker can withdraw the filled output tokens whenever they like.**" },
      { t: "h3", text: "Example: 100 USDC → 1 SOL with 5 BPS fee" },
      {
        t: "list",
        ordered: true,
        items: [
          "The user creates a limit order, pays the rent and deposits 100 USDC into the vault. The price is set to `0.01`.",
          "Once fees are included, trading 1.0005 SOL for 100 USDC becomes favourable and a taker takes the whole order.",
          "Internally, the taker puts 1.0005 SOL into the vault. The 100 USDC moves from the vault to the taker's ATA, and a 0.0005 WSOL fee goes to the fee receiver's wallet.",
          "The contract sees the order is complete. Because the output is SOL, the WSOL special case applies: it expects a **taker-owned WSOL (non-ATA) token account** in the call; the WSOL vault moves 1 SOL into that account, which is then **closed to the maker** so their wallet is credited with 1 SOL; the limit order is closed and its rent goes to the taker; and the taker forwards that rent to the maker, minus whatever they paid for the WSOL token account.",
        ],
      },
      { t: "callout", tone: "info", text: "**For partial fills**, follow the same example but leave out step 4. **For non-WSOL trades**, step 4 is the one thing that changes: the program sets up the maker's ATA with the taker covering its rent, and the taker gets that amount back once the order closes." },
      { t: "divider" },
      { t: "h2", text: "WSOL handling" },
      { t: "p", text: "If the output mint is WSOL and the order is going to close:" },
      {
        t: "list",
        items: [
          "The maker's output account has to be a **seeded (non-ATA) WSOL token account provided by the taker**.",
          "SOL goes into that account from the program, and the account is **closed to the maker**, which adds the SOL straight to the maker's wallet balance.",
          "The taker wraps SOL into their own ATA before the take and closes that ATA afterwards.",
        ],
      },
      { t: "divider" },
      { t: "h2", text: "TakeOrder accounts" },
      {
        t: "table",
        head: ["Index", "Account", "Description"],
        rows: [
          ["`0`", "`taker`", "Taker wallet. **Writable, signer.**"],
          ["`1`", "`maker`", "Maker wallet; receives output tokens on a full fill. **Writable.**"],
          ["`2`", "`inputMint`", "Input token mint. Read-only."],
          ["`3`", "`outputMint`", "Output token mint. Read-only."],
          ["`4`", "`limitOrder`", "Limit order PDA. **Writable.**"],
          ["`5`", "`takerInputMintTokenAccount`", "Taker's input token account; receives the input tokens. **Writable.**"],
          ["`6`", "`takerOutputMintTokenAccount`", "Taker's output token account; pays the output tokens plus fees. **Writable.**"],
          ["`7`", "`makerOutputMintTokenAccount`", "Maker's output token account (a seeded account for WSOL). **Writable.**"],
          ["`8`", "`makerInputMintTokenAccount`", "Maker's input token account; gets the remaining balance on close. **Writable.**"],
          ["`9`", "`feeReceiverTokenAccount`", "Fee receiver's output token account. **Writable.**"],
          ["`10`", "`vaultManager`", "Vault manager PDA (`[\"vault_manager\"]`). Read-only."],
          ["`11`", "`inputMintVault`", "Vault's input token account. **Writable.**"],
          ["`12`", "`outputMintVault`", "Vault's output token account. **Writable.**"],
          ["`13`", "`systemProgram`", "System program. Read-only."],
          ["`14`", "`inputMintProgram`", "Token program for the input mint (SPL or SPL-2022). Read-only."],
          ["`15`", "`outputMintProgram`", "Token program for the output mint (SPL or SPL-2022). Read-only."],
          ["`16`", "`associatedTokenProgram`", "Associated Token Program. Read-only."],
          ["`17`", "`instructionsSysvar`", "Instructions sysvar. Read-only."],
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Instruction data" },
      {
        t: "table",
        head: ["Bytes", "Field", "Type", "Description"],
        rows: [
          ["Byte 0", "`discriminator`", "`u8`", "Always `2` (TakeOrder)."],
          ["Bytes 1–8", "`amount`", "`u64`, little-endian", "Input token amount to take."],
          ["Bytes 9–16", "`max_cost_amount`", "`u64`, little-endian", "Most output tokens the taker will pay. **Use `u64::MAX` for no limit.**"],
          ["Byte 17", "`output_mint_token_account_bump`", "`u8`", "PDA bump for the maker's output token account."],
          ["Byte 18", "`input_mint_token_account_bump`", "`u8`", "PDA bump for the maker's input token account."],
          ["Byte 19", "`fee_receiver_output_mint_bump`", "`u8`", "PDA bump for the fee receiver's output token account."],
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Full execution code" },
      { t: "p", text: "The code below assembles every instruction a `TakeOrder` needs, from setup (creating ATAs, wrapping WSOL) through cleanup (unwrapping WSOL)." },
      { t: "code", lang: "rust", code: TAKE_CODE },
      { t: "divider" },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Limit Orders Overview](${SLO}/overview): how orders are laid out, how prices are computed, time-in-force and fees`,
          `[Limit Order Events](${SLO}/events): the shape of each event and how to decode it from program logs`,
          `[Error Codes](${SLO}/error-codes): the errors the program can return`,
        ],
      },
    ],
  },

  "searchers-limit-orders/events": {
    lead: "Parse limit order events from program logs using Borsh deserialization.",
    blocks: [
      { t: "p", text: "**You can follow limit order events by parsing the program logs for the data they emit.** Events are Borsh-serialized and written to the logs for every order lifecycle operation." },
      { t: "divider" },
      { t: "h2", text: "Event structure" },
      {
        t: "code",
        lang: "rust",
        code: `#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, BorshDeserialize, BorshSerialize)]
pub struct LimitOrderEvent {
    /// Event discriminator, identifies the event type
    /// Create - 1, Take - 2, Cancel - 3, Modify - 4, Withdraw - 5, CloseExpired - 6
    pub discriminator: u8,
    /// Instruction that triggered the event
    pub instruction: u8,
    /// Status of the order
    pub status: u8,
    /// Order id, separates orders with the same (owner, input_mint, output_mint)
    pub id: u8,
    /// Public key of the order's maker
    pub maker: Pubkey,
    /// Mint of the input token
    pub input_mint: Pubkey,
    /// Mint of the output token
    pub output_mint: Pubkey,
    /// Slot at which the event was emitted
    pub slot: u64,
    /// Slot at which the order was created
    pub creation_slot: u64,
    /// Slot at which the order expires
    pub expiration_slot: u64,
    /// Amount of input tokens to be exchanged
    pub amount: u64,
    /// Amount of input tokens filled so far
    pub amount_filled: u64,
    /// Amount of output tokens exchanged so far
    pub out_amount_filled: u64,
    /// Fees paid, in the smallest unit of the from_token mint
    pub fees_paid: u64,
    /// Price base, in the smallest unit of the output token
    pub price_base: u64,
    /// Price = price_base * 10^(-price_exponent)
    pub price_exponent: u8,
    /// Time in force of the order
    pub time_in_force: u8,
    /// Fee rate in ticks charged for the order
    pub fee_ticks: u8,
}`,
      },
      { t: "divider" },
      { t: "h2", text: "Instruction discriminators" },
      { t: "p", text: "The `discriminator` field is always `0`. The `instruction` field tells you which operation produced the event:" },
      {
        t: "list",
        items: [
          "**`1` — `PlaceOrder`**: the maker opened a new limit order.",
          "**`2` — `TakeOrder`**: a searcher took some or all of an order.",
          "**`3` — `CancelOrder`**: the maker cancelled the order.",
          "**`4` — `ModifyOrder`**: the maker changed the order's parameters.",
          "**`5` — `WithdrawFilled`**: the maker pulled out the output tokens already filled on a partially filled order.",
          "**`6` — `CloseExpired`**: an order past its expiry was closed and the rent recovered.",
        ],
      },
      { t: "callout", tone: "info", text: `The \`status\` field in an event shows the order's state **after** the operation. Interpret it with the [OrderStatus](${SLO}/overview#order-status) values.` },
      { t: "divider" },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Limit Orders Overview](${SLO}/overview): how orders are laid out, time-in-force, order status and fees`,
          `[Placing Taker Orders](${SLO}/take-order): the TakeOrder instruction plus working execution code`,
          `[Error Codes](${SLO}/error-codes): the errors the program can return`,
        ],
      },
    ],
  },

  "searchers-limit-orders/error-codes": {
    lead: "Custom error codes thrown by the Titan Limit Order program.",
    blocks: [
      { t: "p", text: "**These are the custom error codes the Titan Limit Order program can return.** Each one corresponds to a particular on-chain validation failure." },
      {
        t: "code",
        lang: "rust",
        code: `#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LimitOrderError {
    InvalidOrderStatus,                   // 0
    InvalidAmount,                        // 1
    InvalidMaker,                         // 2
    InvalidMint,                          // 3
    InvalidPrice,                         // 4
    InvalidTokenAccountAuthority,         // 5
    InvalidTokenProgramId,                // 6
    InvalidAssociatedTokenAccountAddress, // 7
    InvalidExtension,                     // 8
    EventDeserializationError,            // 9
    ExpirationSlotExceeded,               // 10
    ExecutionTimeInForceViolation,        // 11
    MaxCostLimitExceeded,                 // 12
    OrderNotExpired,                      // 13
}`,
      },
      {
        t: "list",
        items: [
          `**\`0\` — \`InvalidOrderStatus\`**: the order is not in a state that allows this operation. Check its [status](${SLO}/overview#order-status) first.`,
          "**`1` — `InvalidAmount`**: the amount is zero or larger than the remaining balance.",
          "**`2` — `InvalidMaker`**: the maker public key does not match the order.",
          "**`3` — `InvalidMint`**: the token mint is neither the order's input nor its output mint.",
          "**`4` — `InvalidPrice`**: the price parameters are invalid, for example a zero `price_base`.",
          "**`5` — `InvalidTokenAccountAuthority`**: the token account's authority is not the expected owner.",
          "**`6` — `InvalidTokenProgramId`**: the token program supplied does not suit the mint. **Pass SPL Token for SPL mints, and SPL Token-2022 for Token-2022 mints.**",
          "**`7` — `InvalidAssociatedTokenAccountAddress`**: the ATA address differs from the expected derivation.",
          "**`8` — `InvalidExtension`**: the program does not support this token extension.",
          "**`9` — `EventDeserializationError`**: event data could not be deserialized.",
          "**`10` — `ExpirationSlotExceeded`**: the order has expired. **It cannot be filled after `expiration_slot`.**",
          `**\`11\` — \`ExecutionTimeInForceViolation\`**: the take breaks the order's [time-in-force](${SLO}/overview#time-in-force) policy, for example a partial fill on an \`AllOrNothing\` order.`,
          "**`12` — `MaxCostLimitExceeded`**: the cost is above the taker's `max_cost_amount`. Raise the limit or take less.",
          "**`13` — `OrderNotExpired`**: an attempt to close an order that has not expired yet. Wait until `expiration_slot` is reached.",
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Limit Orders Overview](${SLO}/overview): how orders are laid out, time-in-force and order status`,
          `[Placing Taker Orders](${SLO}/take-order): the TakeOrder instruction plus working execution code`,
          `[Limit Order Events](${SLO}/events): the shape of each event and how to decode it from program logs`,
        ],
      },
    ],
  },
};
