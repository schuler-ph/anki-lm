import PrivacyPolicy from "../../content/privacy.mdx";

function About() {
  return (
    <>
      About Page
      <div className="p-10 flex justify-center">
        <article className="prose">
          <PrivacyPolicy />
        </article>
      </div>
    </>
  );
}

export default About;
