import Link from "next/link";
export default function Forbidden(){return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">ACCESS DENIED</p><h1>Not permitted</h1><p>Your account does not have access to this function.</p><Link href="/">Return to the application</Link></section></main>}
