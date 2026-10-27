import { TextInput, TextInputProps } from "react-native";

export interface InputProps extends TextInputProps {}

export function Input({ style, ...props }: InputProps) {
  return (
    <TextInput
      className="w-full max-w-[340px] h-12 border border-gray-300 rounded-lg px-4 mb-3 text-base bg-white text-gray-800"
      placeholderTextColor="#999"
      {...props}
    />
  );
}
