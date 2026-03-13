#!/bin/bash
# Run tests

for f in test_*.js; do
	node $f
done
