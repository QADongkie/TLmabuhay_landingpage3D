import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tl-mabuhay-road-to-ready.marietankarla.chatgpt.site"),
  title: "TL Mabuhay — Your Defensive Driving Advocate",
  description:
    "TL Mabuhay Driving Lesson Academy — Your Defensive Driving Advocate.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "TL Mabuhay — Your Defensive Driving Advocate",
    description: "Your Defensive Driving Advocate.",
    type: "website",
    images: [{
      url: "/og.png",
      width: 1536,
      height: 1024,
      alt: "TL Mabuhay — Road to Ready. Your Defensive Driving Advocate.",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TL Mabuhay — Your Defensive Driving Advocate",
    description: "Your Defensive Driving Advocate.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
