import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";

/**
 * Free stand-ins for the reference sites' faces. Titan's headings use a commercial serif we can't
 * copy; Fraunces (SIL OFL) is the closest open serif. The docs use Inter and IBM Plex Mono (both OFL).
 */
export const displaySerif = Fraunces({ subsets: ["latin"], weight: ["400"], variable: "--font-display", display: "swap" });
export const docsSans = Inter({ subsets: ["latin"], variable: "--font-docs", display: "swap" });
export const docsMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-docs-mono", display: "swap" });
