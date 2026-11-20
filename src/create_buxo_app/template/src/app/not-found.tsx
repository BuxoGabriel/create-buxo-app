import { MdHome } from 'react-icons/md';
import { LinkButton } from '@/components/button';
import Container from '@/components/container';
import PageHeader from '@/components/page-header';

export default function NotFound() {
  return (
    <Container>
      <PageHeader
        title="Page not found"
        description="The page you are looking for does not exist or has moved. Check that the address is correct."
      />
      <LinkButton href="/" icon={<MdHome />}>
        Home page
      </LinkButton>
    </Container>
  );
}
