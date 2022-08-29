import React, { FC, useEffect, useState } from 'react';
import { Container, Pagination } from "react-bootstrap";

function SearchNavigation() {
  return (
    <Container>
      <Pagination className="justify-content-center">
        <Pagination.Prev />
        <Pagination.Item active>{1}</Pagination.Item>
        <Pagination.Next />
      </Pagination>
    </Container>
  );
}

export default SearchNavigation;