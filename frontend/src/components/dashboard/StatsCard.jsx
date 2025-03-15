import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, type = "number", icon: Icon }) {
  const formatValue = () => {
    if (type === "currency") {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(value);
    }
    return value.toLocaleString();
  };

  return (
    <Card>
      <motion.div
        className="p-6 flex items-start gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`p-3 rounded-lg bg-primary/10`}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold mt-2">{formatValue()}</p>
        </div>
      </motion.div>
    </Card>
  );
}
