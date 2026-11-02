export interface DatePickerModalProps {
  visible: boolean;
  valueIso: string;
  onClose: () => void;
  onSelect: (isoDate: string) => void;
}
