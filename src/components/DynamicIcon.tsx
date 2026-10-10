import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

// Resolves an admin-entered icon name (e.g. "ShieldCheck", stored as plain text on
// HomeSectionItem.iconName) to the matching lucide-react component. Falls back to
// a generic circle if the name doesn't match any icon, so a typo in the admin never
// crashes the page.
export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const icons = Icons as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Icon = icons[name] || Icons.Circle;
  return <Icon {...props} />;
}
