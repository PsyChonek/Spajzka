import React from 'react';
import { render, screen } from '@testing-library/react';
import Search from '../Pages/Search';

test('renders learn react link', () => {
  render(<Search />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
