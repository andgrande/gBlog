import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Head from 'next/head';
import Link from 'next/link';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ next_page, results }: PostPagination) {
  // TODO

  return (
    <>
      <Head>
        <title>Posts | gBlog</title>
      </Head>

      <main className={styles.container}>

        <div className={styles.posts}>
          {results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.postDetail}>
                  <time>
                    <FiCalendar size={20}/>
                    {post.first_publication_date}
                  </time>
                  <span>
                    <FiUser size={20} />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </div>
        
        {next_page && (
          <p>Carregar mais...</p>
        )}

      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ],
    {
      fetch: ['posts.title', "posts.subtitle", "posts.author"],
      pageSize: 5,
    }
  );

  // console.log(JSON.stringify(postsResponse, null, 2));

  const results = postsResponse.results.map(post => {

    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd LLL yyyy', 
        {
          locale: ptBR,
        }
      )
      ,
    }

  })

  const next_page = postsResponse.next_page || '';

  return {
    props: { next_page, results }
  }

};
