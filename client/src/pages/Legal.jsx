import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CONTACT_EMAIL, LAST_UPDATED } from "../legal/config.js";
import { PRIVACY, TERMS } from "../legal/content.js";

// "Account details: ..." -> the words before the colon become bold
function Bullet({ text }) {
  const colon = text.indexOf(": ");
  if (colon > 0 && colon < 45) {
    return (
      <li>
        <strong>{text.slice(0, colon + 1)}</strong>
        {text.slice(colon + 1)}
      </li>
    );
  }
  return <li>{text}</li>;
}

const slug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// One layout for both pages: list of sections on the left, text on the right
function LegalPage({ doc }) {
  // Show the page name in the browser tab
  useEffect(() => {
    const before = document.title;
    document.title = `${doc.title} | Spacio`;
    return () => {
      document.title = before;
    };
  }, [doc.title]);

  return (
    <div className="wrap page-pad legal">
      <aside className="legal-toc">
        <strong>On this page</strong>
        <ol>
          {doc.sections.map((s) => (
            <li key={s.title}>
              <a href={"#" + slug(s.title)}>{s.title}</a>
            </li>
          ))}
        </ol>
      </aside>

      <article className="legal-text">
        <h1>{doc.title}</h1>
        <p className="muted">Last updated: {LAST_UPDATED}</p>
        <p className="legal-intro">{doc.intro}</p>

        {doc.sections.map((s, i) => (
          <section key={s.title} id={slug(s.title)}>
            <h2>{i + 1}. {s.title}</h2>
            {s.body.map((block, j) =>
              Array.isArray(block) ? (
                <ul key={j}>{block.map((item) => <Bullet key={item} text={item} />)}</ul>
              ) : (
                <p key={j}>{block}</p>
              )
            )}
          </section>
        ))}

        <div className="legal-contact">
          <h2>Contact us</h2>
          <p>
            Questions about this page, your information, or your account? Email us at{" "}
            <a href={"mailto:" + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>.
          </p>
          <p className="muted">
            <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Use</Link>
          </p>
        </div>
      </article>
    </div>
  );
}

export function Privacy() {
  return <LegalPage doc={PRIVACY} />;
}

export function Terms() {
  return <LegalPage doc={TERMS} />;
}
