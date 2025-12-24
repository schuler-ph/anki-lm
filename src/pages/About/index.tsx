import PrivacyPolicy from "../../content/privacy.mdx";
import Praxis from "../../content/praxis.mdx";

function About() {
  return (
    <>
      About Page
      <div className="p-10 flex justify-center">
        <article className="prose">
          <PrivacyPolicy />
          <Praxis />
        </article>
      </div>
    </>
  );
}

export default About;
