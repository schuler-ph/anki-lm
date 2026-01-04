function Article({ Content }: { Content: React.ComponentType<unknown> }) {
  return (
    <div className="p-10 flex justify-center">
      <article className="prose max-w-3xl w-3xl">
        <Content />
      </article>
    </div>
  );
}

export default Article;
