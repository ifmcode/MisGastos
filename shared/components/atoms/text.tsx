import { Text as RNText, TextProps } from "react-native";

export interface TextProps extends TextProps {
  variant?: "title" | "subtitle" | "body" | "caption";
}

export function Text({ variant = "body", style, ...props }: TextProps) {
  const variants = {
    title: "text-2xl font-bold",
    subtitle: "text-lg",
    body: "text-base",
    caption: "text-sm opacity-70",
  };

  return <RNText className={variants[variant]} {...props} />;
}
