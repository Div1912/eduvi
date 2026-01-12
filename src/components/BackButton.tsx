import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface BackButtonProps {
  to?: string;
  label?: string;
}

const BackButton = ({ to, label = 'Back' }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
};

export default BackButton;