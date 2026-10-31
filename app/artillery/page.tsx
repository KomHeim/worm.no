import { redirect } from 'next/navigation';

// Keep the existing Snake homepage intact. Artillery is an independent, static game.
export default function ArtilleryPage() {
  redirect('/artillery/index.html');
}
