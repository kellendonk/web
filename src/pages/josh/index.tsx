import React, { HTMLAttributes, useEffect, useState } from 'react';
import { HeroTitle } from '../../components/HeroTitle';
import { MainLayout } from '../../components/MainLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDiscord,
  faGithub,
  faLinkedin,
  faMastodon,
  faSteam,
  faTelegram,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import Link from 'next/link';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import Head from 'next/head';
import { GradientText } from '../../components/GradientText';

import joshProfile from '../../assets/josh-profile.jpg';
import Image from 'next/image';
import clsx from 'clsx';
import { SubjectInteractions } from '../../components/SubjectInteractions';
import {
  GuestBookImageDisplay,
  GuestBookInput,
  useGuestBookSignatures,
} from '../../components/GuestBookInput';

export function Page() {
  const guestBookImages = useGuestBookSignatures('/josh');

  return (
    <MainLayout>
      <Head>
        <title>Josh&apos;s Online Profiles</title>
        <meta
          name='description'
          content="Links to Josh's various online profiles."
        />
      </Head>

      <section className='mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-20 lg:py-16 lg:pt-20 text-center'>
        <HeroTitle>
          Hi, I&apos;m <GradientText>Josh</GradientText>
        </HeroTitle>

        <div className='flex mt-16 justify-center items-stretch gap-8 md:gap-16 flex-wrap md:flex-nowrap'>
          <div className='min-w-[250px] flex flex-col justify-center'>
            <Image
              src={joshProfile}
              alt="Josh's Picture"
              width='250'
              height='250'
              className='rounded-full'
              priority
            />

            <div className='mt-6 border-2 border-[#aaa] rounded-xl p-2 relative'>
              Josh Kellendonk
              <svg
                width='20'
                height='15'
                className='absolute top-[-15px] left-[calc(50%-10px)]'
              >
                <path
                  stroke='#aaa'
                  fill='#fff'
                  strokeWidth='2'
                  d='M 0 15 L 10 0 L 20 15'
                />
              </svg>
            </div>
          </div>

          <div
            className='md:mt-7 min-w-full md:min-w-[50px] md:order-3 flex flex-wrap justify-center gap-4 md:flex-col md:justify-start md:items-start'>
            <SubjectInteractions subject='/josh' />
          </div>

          <div className='shrink text-left'>
            <Para>
              I&apos;m a Cloud Solutions Architect and Software Developer from
              Calgary, Alberta 🇨🇦. I am intimately familiar with the AWS cloud
              and Kubernetes, having used AWS since 2008 and Kubernetes before
              1.0, and I have a passion for building scalable solutions using
              emerging technologies.
            </Para>
            <Para>
              In 2023, my focus has been on building out advanced AI projects.
              Utilizing OpenAI, HuggingFace, cloud GPU capacity, and a plethora
              of ML models, I&apos;ve built and released several solutions
              tailored for retrieval augmented generation, agents, and image
              diffusion.
            </Para>
            <Para>
              I&apos;m excited to see what the future holds for AI. Most days,
              you can find me hacking on an AI-augmented SaaS product or helping
              my team deliver top-quality serverless products.
            </Para>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 text-center lg:py-16'>
        <HeroTitle>
          Josh&apos;s <GradientText>online profiles</GradientText>
        </HeroTitle>

        <div className='flex flex-wrap justify-center gap-14 mt-20 px-10 max-w-2xl mx-auto'>
          <TreeLink icon={faGithub} href='https://github.com/misterjoshua'>
            GitHub
          </TreeLink>
          <TreeLink
            icon={faMastodon}
            href='https://fosstodon.org/@misterjoshua'
          >
            Mastodon
          </TreeLink>
          <TreeLink icon={faTelegram} href='https://t.me/Klonkadonk'>
            Telegram
          </TreeLink>
          <TreeLink
            icon={faDiscord}
            href='https://discordapp.com/users/110936588887822336'
          >
            Discord
          </TreeLink>
          <TreeLink
            icon={faSteam}
            href='https://steamcommunity.com/id/klonkadonk/'
          >
            Steam
          </TreeLink>
          <TreeLink href='https://twitter.com/eigenseries' icon={faTwitter}>
            Twitter
          </TreeLink>
          <TreeLink
            href='https://www.linkedin.com/in/kellendonk'
            icon={faLinkedin}
          >
            LinkedIn
          </TreeLink>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 text-center lg:pay-16'>
        <HeroTitle>
          Sign my <GradientText>guest book</GradientText>
        </HeroTitle>

        <div className='flex flex-wrap justify-center gap-14 mt-20 px-10 max-w-2xl mx-auto'>
          <GuestBookInput guestbook='/josh' refresh={guestBookImages.refresh} />
        </div>
      </section>

      <section className='my-10'>
        <div className='flex px-4 flex-wrap justify-center gap-7'>
          {guestBookImages.images.map((x, i) => (
            <GuestBookImageDisplay key={i} image={x.image} width={200} />
          ))}
        </div>
      </section>
    </MainLayout>
  );
}

export default Page;

type TreeLinkProps = React.PropsWithChildren<{
  href: string;
  icon: IconProp;
}>;

const TreeLink = (props: TreeLinkProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Cause hover animation to run only once. (1 second animation duration)
  useEffect(() => {
    if (!isAnimating) return;

    const handle = setTimeout(() => setIsAnimating(false), 1000);

    return () => {
      clearTimeout(handle);
    };
  }, [isAnimating, setIsAnimating]);

  return (
    <div>
      <Link
        href={props.href}
        className='flex flex-col text-2xl w-[100px] hover:text-[#ed3125]'
        rel='me'
        onMouseEnter={() => setIsAnimating(true)}
        onMouseLeave={() => setIsAnimating(false)}
      >
        <FontAwesomeIcon
          icon={props.icon}
          className='text-[75px]'
          bounce={isAnimating}
          dur='1s'
          height={100}
        />
        <div className='mt-4'>{props.children}</div>
      </Link>
    </div>
  );
};

const Para = (props: HTMLAttributes<HTMLParagraphElement>) => (
  <p {...props} className={clsx('my-6 leading-7', props.className)}>
    {props.children}
  </p>
);
