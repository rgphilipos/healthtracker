import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    children?: React.ReactNode;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
    }
  }
} 