import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/services/auth/lib/auth-server-fns";

export const Route = createFileRoute("/app/")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();

    if (!session) {
      throw redirect({
        to: "/",
        search: { redirect: location.href },
      });
    }

    return { user: session.user };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/"!</div>;
}
