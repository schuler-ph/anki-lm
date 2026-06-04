function Article({ Content }: { Content: React.ComponentType<unknown> }) {
  return (
    <div className="px-4 py-8 sm:px-6 md:p-10 flex justify-center">
      <article className="prose max-w-3xl w-full">
        <Content />
      </article>
    </div>
  );
}

export default Article;
