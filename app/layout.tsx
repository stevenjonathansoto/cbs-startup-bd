import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Startup Engagement | CBS CMC Prototype',description:'An individual MBA prototype for evidence-grounded startup engagement. Synthetic data only.'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
