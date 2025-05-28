declare module 'react-native-picker-horizontal' {
  import { ReactNode } from 'react';

  interface HorizontalPickerProps {
    data: any[];
    renderItem: (item: any, index: number) => ReactNode;
    itemWidth: number;
    defaultIndex?: number;
    onChange?: (index: number) => void;
  }

  const HorizontalPicker: React.FC<HorizontalPickerProps>;
  export default HorizontalPicker;
} 