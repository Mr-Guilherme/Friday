import { redirect } from "next/navigation";
import { ChatShell } from "@/features/chat/chat-shell";
import { getConversationState } from "@/features/chat/data";
import { getCurrentUserProfile } from "@/features/profile/data";

export default async function Home() {
  const session = await getCurrentUserProfile();

  if (!session) {
    redirect("/login");
  }

  const { conversations, messagesByConversation } = await getConversationState(session.user.id);

  return (
    <ChatShell
      locale={session.profile.preferred_locale}
      conversations={conversations}
      messagesByConversation={messagesByConversation}
    />
  );
}
