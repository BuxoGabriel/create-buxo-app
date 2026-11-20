import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Button, { LinkButton } from '@/components/button';

describe('Button', () => {
  test('is a plain button by default, so it never submits a form by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  test('calls onClick, but not while disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Save
      </Button>
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('applies the variant and lets className override it', () => {
    render(
      <Button variant="tonal" className="bg-tertiary">
        Save
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-on-secondary-container', 'bg-tertiary');
    expect(button).not.toHaveClass('bg-secondary-container');
  });

  test('hides icons from assistive tech', () => {
    render(<Button icon={<svg data-testid="icon" />}>Save</Button>);
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button')).toHaveAccessibleName('Save');
  });
});

describe('LinkButton', () => {
  test('renders a link that looks like a button', () => {
    render(<LinkButton href="https://example.com">Docs</LinkButton>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveClass('bg-primary');
  });
});
