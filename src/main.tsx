import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './router';
import './index.css';

export const createRoot = ViteReactSSG({ routes });
