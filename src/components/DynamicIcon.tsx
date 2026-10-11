import type { ComponentType } from "react";
import {
  Award, BadgeCheck, BadgeDollarSign, Banknote, Building, Building2, Calendar, CalendarCheck, Check, CheckCircle2, Circle, Clock, ClipboardCheck,
  CreditCard, Droplets, Factory, Fan, FileCheck, Gauge, Gift, Globe, Hammer, Headphones, Heart, HeartHandshake, House, Leaf, Lightbulb, Mail,
  MapPin, MapPinned, Medal, MessageCircle, Package, PaintRoller, Percent, Phone, Plug, Receipt, Recycle, Settings, ShieldCheck, Smartphone,
  Smile, Snowflake, Sparkles, Star, Tag, Thermometer, ThumbsUp, Timer, Trophy, Truck, UserCheck, Users, Wind, Wrench, Zap,
  type LucideProps,
} from "lucide-react";

// A fixed set instead of "every icon in the library": importing the whole library added ~200 KB of JavaScript to the
// homepage. Names are matched forgivingly (ShieldCheck, shield-check and "shield check" are the same). The admin's
// icon fields suggest these names; anything else shows a plain circle rather than breaking the page.
// Keep in sync with src/lib/cms/icons.ts in the admin app.
const ICONS: Record<string, ComponentType<LucideProps>> = {
  Award, BadgeCheck, BadgeDollarSign, Banknote, Building, Building2, Calendar, CalendarCheck, Check, CheckCircle2, Circle, Clock, ClipboardCheck,
  CreditCard, Droplets, Factory, Fan, FileCheck, Gauge, Gift, Globe, Hammer, Headphones, Heart, HeartHandshake, House, Home: House, Leaf, Lightbulb, Mail,
  MapPin, MapPinned, Medal, MessageCircle, Package, PaintRoller, Percent, Phone, Plug, Receipt, Recycle, Settings, ShieldCheck, Smartphone,
  Smile, Snowflake, Sparkles, Star, Tag, Thermometer, ThumbsUp, Timer, Trophy, Truck, UserCheck, Users, Wind, Wrench, Zap,
};

const toPascal = (name: string) => name.trim().replace(/(^|[-_\s]+)([A-Za-z0-9])/g, (_, __, c: string) => c.toUpperCase());

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[toPascal(name)] ?? Circle;
  return <Icon {...props} />;
}
