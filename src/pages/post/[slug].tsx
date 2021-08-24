import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from "prismic-dom";
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import useWindowSize from '../../hooks/useWindowSize';
import { useUtterances } from '../../hooks/useUtterances';

import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Link from 'next/link';
import ExitPreviewButton from '../../components/ExitPreviewButton';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface NextPosts {
  previousPost: {
    title: string | null;
    uid: string | null;
  },
  followingPost: {
    title: string | null;
    uid: string | null;
  };
}

interface PostProps {
  post: Post;
  nextPosts: NextPosts;
  preview: boolean;
}

const commentNodeId = 'comments';

export default function Post({ post, nextPosts, preview }: PostProps) {
  const router = useRouter();
  const windowHeightProgress: Number = useWindowSize();
  useUtterances(commentNodeId);

  const totalWords = post.data.content.reduce((accumulator, current) => {

    const headingCount = current.heading ? current.heading.split(/\s/).length : 0;
    const bodyCount = current.body ? RichText.asText(current.body).split(/\s/).length : 0;

    return accumulator + headingCount + bodyCount;
  }, 0);

  const estimatedReadingTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
          <title>Postin | gBlog</title>
      </Head>

      <main className={styles.container}>

        {router.isFallback ? (
          <div>Carregando...</div>
        ) : (
          <>
            <header className={styles.postHeader}>
              <div className={styles.progressBarParent} >
                <div className={styles.progressBarChild} style={{width: `${windowHeightProgress}%`} }></div>
                <div></div>
              </div>
              <img src={post.data.banner.url} alt={post.data.title} />

              <h1>{post.data.title}</h1>
              <div className={styles.postDetails}>
                <time>
                  <FiCalendar size={20} />
                  {format(new Date(post.first_publication_date), 'dd MMM yyyy', 
                      {
                        locale: ptBR,
                      })}
                </time>
                <span>
                  <FiUser size={20} />
                  {post.data.author}
                </span>
                <span>
                  <FiClock size={20} />
                  {estimatedReadingTime} min
                </span>
              </div>
              {
                post.last_publication_date && (
                  <div className={styles.postUpdatedDate}>
                    <span>* editado em {
                      format(new Date(post.last_publication_date), "dd MMM yyy', às 'kk':'mm",
                        {
                          locale: ptBR,
                        })}
                    </span>
                  </div>
                )
              }
              
            </header>

            <article className={styles.postContent}>
              {post.data.content.map(section => (
                <>
                  <h1 className={styles.subtitle} key={section.heading}>{section.heading}</h1>
                  <div 
                    className={styles.scope}
                    dangerouslySetInnerHTML={{__html: RichText.asHtml(section.body)}} 
                  />
                </>
              ))}
            </article>
          </>
        )}

        <hr />

        <section className={styles.morePosts}>
          <div>
            <Link href={`/post/${nextPosts.previousPost.uid}`}>
            {
              nextPosts.previousPost.title !== null ? (
                <a>
                  <span>{nextPosts.previousPost.title}</span>
                  <strong>Post anterior</strong>
                </a>
            ) : <div></div>}
            </Link>

            <Link href={`/post/${nextPosts.followingPost.uid}`}>
              {
                nextPosts.followingPost.title !== null ? (
                  <a>
                    <span>{nextPosts.followingPost.title}</span>
                    <strong>Próximo post</strong>
                  </a>
              ) : <div></div>}
            </Link>
          </div>
        </section>

        <section className={styles.comments}>
          <div id={commentNodeId} />
        </section>

        {preview && (
          <ExitPreviewButton />
        )}

      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ],
  {
    fetch: ['posts.uid']
  });

  return {
    paths: [
      ...posts.results.map(item => { return { 
        params: { slug: item.uid }
      }})
    ],
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({
  params, 
  preview = false, 
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const postResponse = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null
  });
  const followingPost = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
    ],
    {
      fetch: ['posts.title'],
      pageSize: 1,
      after: postResponse.id,
      orderings: '[document.first_publication_date]',
    }
  );
  const previousPost = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
    ],
    {
      fetch: ['posts.title'],
      pageSize: 1,
      after: postResponse.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const post = {
    uid: postResponse.uid,
    first_publication_date: postResponse.first_publication_date,
    last_publication_date: 
      postResponse.last_publication_date !== 
        postResponse.first_publication_date ? 
        postResponse.last_publication_date : null,
    data: {
      title: postResponse.data.title,
      banner: {
        url: postResponse.data.banner?.url,
      },
      subtitle: postResponse.data.subtitle,
      author: postResponse.data.author,
      content: [...postResponse.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body.map(body => {
            return {
              ...body,
            }
          })]
        }
      })],
    }
  }

  // console.log(JSON.stringify(postResponse, null, 2))
  // console.log(JSON.stringify(post, null, 2))

  const surroundingPosts = {
    previousPost: {
      title: previousPost.results.length ? previousPost.results?.[0].data.title : null,
      uid: previousPost.results.length ? previousPost.results?.[0].uid : null,
    },
    followingPost: {
      title: followingPost.results.length ? followingPost.results?.[0].data.title : null,
      uid: followingPost.results.length ? followingPost.results?.[0].uid : null,
    }
  }

  // console.log(JSON.stringify(surroundingPosts, null, 2));

  return {
    props: {
      post,
      nextPosts: surroundingPosts,
      preview,
    },
    redirect: 60 * 30 // 30 minutes
  }
};
