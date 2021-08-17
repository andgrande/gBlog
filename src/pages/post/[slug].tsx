import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Prismic from '@prismicio/client';
import { RichText } from "prismic-dom";
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  
  const totalWords = post.data.content.reduce((accumulator, current) => {

    const headingCount = current.heading.split(/\s/).length;
    const bodyCount = RichText.asText(current.body).split(/\s/).length;

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
      ...posts.results.map(item => { return { params: { slug: item.uid }}})
    ],
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {})

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner?.url,
      },
      subtitle: response.data.subtitle,
      author: response.data.author,
      content: [...response.data.content.map(content => {
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

  // console.log(JSON.stringify(response, null, 2))
  // console.log(JSON.stringify(post, null, 2))

  return {
    props: { post },
    redirect: 60 * 30 // 30 minutes
  }
};
