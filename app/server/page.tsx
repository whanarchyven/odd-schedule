import { redirect } from "next/navigation";

export default async function ServerPage() {
  redirect("/schedule");
}
