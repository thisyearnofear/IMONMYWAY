import { Card } from "./PremiumCard";

interface TestimonialProps {
  name: string;
  avatar: string;
  text: string;
  amount?: string;
}

export function ConsumerTestimonial({ name, avatar, text, amount }: TestimonialProps) {
  return (
    <Card variant="floating" className="p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-white text-sm">{name}</span>
            {amount && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">
                +{amount}
              </span>
            )}
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{text}</p>
          <div className="flex items-center gap-1 mt-2 text-yellow-400">
            ⭐⭐⭐⭐⭐
          </div>
        </div>
      </div>
    </Card>
  );
}