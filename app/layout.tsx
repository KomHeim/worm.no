import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={metadataBase:new URL('https://worm.no'),title:'Worm.no – Classic Snake Game',description:'Play the classic Nokia-style Snake game. Beat your personal best and compete on the global Worm.no leaderboard.',openGraph:{title:'Worm.no – Classic Snake Game',description:'One more bite. A little nostalgia. A new high score.',type:'website',images:[{url:'/og.png',width:1200,height:630}]},icons:{icon:'/favicon.svg'},robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
