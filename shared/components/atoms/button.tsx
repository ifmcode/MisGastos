import { Pressable, PressableProps, Text, ActivityIndicator } from "react-native";

export interface ButtonProps extends PressableProps {
  title: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

export function Button({ title, variant = "primary", loading = false, disabled, style, ...props }: ButtonProps) {
  const baseStyles = "px-4 py-3 rounded-lg items-center justify-center";
  const variants = {
    primary: "bg-[#0a7ea4]",
    secondary: "bg-gray-600",
    danger: "bg-[#db4437]",
    ghost: "bg-transparent",
  };

  const textVariants = {
    primary: "text-white font-semibold",
    secondary: "text-white font-semibold",
    danger: "text-white font-semibold",
    ghost: "text-[#0a7ea4] font-semibold",
  };

  return (
    <Pressable
      className={`${baseStyles} ${variants[variant]} ${disabled || loading ? "opacity-50" : ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={textVariants[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}
