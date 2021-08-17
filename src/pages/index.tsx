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
import { useState } from 'react';

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

export default function Home({ postsPagination }: HomeProps) {
  
  const [posts, setPosts] = useState<Post[] | null>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(postsPagination.next_page);

  const handleFetchPosts = () => {
    fetch(nextPage)
    // .then(response => response.blob())
    // .then(async myBlob => await myBlob.text())
    // .then(newPosts => JSON.parse(newPosts))
    .then(async response => await response.json())
    .then(item => {
      const newPosts = item.results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: post.first_publication_date,
          data: 
            {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          }
      });

      setPosts([
        ...posts, 
        ...newPosts,
      ]);
      setNextPage(item.next_page);
    })
  }

  return (
    <>
      <Head>
        <title>Posts | gBlog</title>
      </Head>

      <main className={styles.container}>

        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.postDetail}>
                  <time>
                    <FiCalendar size={20}/>
                    {/* {post.first_publication_date} */}
                    {format(new Date(post.first_publication_date),
                      'dd MMM yyyy', 
                      {
                        locale: ptBR,
                      }
                    )}
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
        
        {nextPage && (
          <div className={styles.loadPosts}>
            <button type="button" onClick={() => handleFetchPosts()} >Carregar mais posts</button>
          </div>
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
      first_publication_date: post.first_publication_date
    }
  })

  return {
    props: { 
      postsPagination: {
        next_page: postsResponse.next_page, 
        results
      }
    }
  }

};
