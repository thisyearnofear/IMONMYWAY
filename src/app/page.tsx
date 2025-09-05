import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to plan page as the main entry point
  redirect("/plan");
}
