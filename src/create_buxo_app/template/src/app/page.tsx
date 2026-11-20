import {
  MdArrowForward,
  MdOutlineChecklist,
  MdOutlinePalette,
  MdOutlineWidgets,
} from 'react-icons/md';
import { LinkButton } from '@/components/button';
import Card from '@/components/card';
import Container from '@/components/container';
import JsonLd from '@/components/json-ld';
import Section from '@/components/section';
import { type PageInfo, pageMetadata } from '@/lib/metadata';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { webPageLd } from '@/lib/structured-data';

const PAGE = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  path: '/',
  absoluteTitle: true,
} satisfies PageInfo;

export const metadata = pageMetadata(PAGE);

// Starter content: replace everything in this file.
export default function Home() {
  return (
    <Container>
      <header className="py-16 sm:py-24">
        <h1 className="max-w-[18ch] type-display-md type-brand">{SITE_NAME}</h1>
        <p className="mt-6 max-w-[60ch] type-body-lg text-on-surface-variant">{SITE_DESCRIPTION}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/styleguide" trailingIcon={<MdArrowForward />}>
            See the styleguide
          </LinkButton>
          <LinkButton href="https://nextjs.org/docs" variant="outlined">
            Next.js docs
          </LinkButton>
        </div>
      </header>

      <Section
        title="What is already here"
        description="This page is src/app/page.tsx. Everything on it is a placeholder built from the components in src/components."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="A theme from your colors" icon={<MdOutlinePalette />} variant="outlined">
            Material 3 color roles are generated from the seeds in theme.config.json. Run{' '}
            <code>pnpm theme</code> after changing them.
          </Card>
          <Card
            title="Building blocks"
            href="/styleguide"
            icon={<MdOutlineWidgets />}
            variant="outlined"
          >
            Buttons, cards, fields, dialogs, and navigation, all on one page to copy from.
          </Card>
          <Card
            title="Checks that run on every PR"
            icon={<MdOutlineChecklist />}
            variant="outlined"
          >
            Prettier, ESLint, type checking, Vitest, and a production build. Run them locally with{' '}
            <code>pnpm check</code>.
          </Card>
        </div>
      </Section>
      <JsonLd data={webPageLd(PAGE)} />
    </Container>
  );
}
