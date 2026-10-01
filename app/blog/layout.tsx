import 'katex/dist/katex.min.css';
import './blog.css';
import { routeMetadata } from '../../lib/routeMetadata';
export function generateMetadata() { return routeMetadata('/blog', 'Blog', 'Articles, development journals and creative projects by Josh Skinner.', false); }
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
