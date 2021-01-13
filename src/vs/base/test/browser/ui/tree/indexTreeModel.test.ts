/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { ITreeNode, ITreeFilter, TreeVisibility, ITreeElement } from 'vs/base/browser/ui/tree/tree';
import { IndexTreeModel, IIndexTreeNode, IList, IIndexTreeModelOptions } from 'vs/base/browser/ui/tree/indexTreeModel';

function toList<T>(arr: T[]): IList<T> {
	return {
		splice(start: number, deleteCount: number, elements: T[]): void {
			arr.splice(start, deleteCount, ...elements);
		},
		updateElementHeight() { }
	};
}

function toArray<T>(list: ITreeNode<T>[]): T[] {
	return list.map(i => i.element);
}

/**
 * Calls that test function twice, once with an empty options and
 * once with `diffIdentityProvider`.
 */
function withSmartSplice(fn: (options: IIndexTreeModelOptions<number, any>) => void) {
	fn({});
	fn({ diffIdentityProvider: { getId: n => String(n) } });
}

suite('IndexTreeModel', () => {

	test('ctor', () => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1);
		assert(model);
		assert.equal(list.length, 0);
	});

	test('insert', () => withSmartSplice(options => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1, options);

		model.splice([0], 0, [
			{ element: 0 },
			{ element: 1 },
			{ element: 2 }
		]);

		assert.deepEqual(list.length, 3);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[0].depth, 1);
		assert.deepEqual(list[1].element, 1);
		assert.deepEqual(list[1].collapsed, false);
		assert.deepEqual(list[1].depth, 1);
		assert.deepEqual(list[2].element, 2);
		assert.deepEqual(list[2].collapsed, false);
		assert.deepEqual(list[2].depth, 1);
	}));

	test('deep insert', () => withSmartSplice(options => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1, options);

		model.splice([0], 0, [
			{
				element: 0, children: [
					{ element: 10 },
					{ element: 11 },
					{ element: 12 },
				]
			},
			{ element: 1 },
			{ element: 2 }
		]);

		assert.deepEqual(list.length, 6);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[0].depth, 1);
		assert.deepEqual(list[1].element, 10);
		assert.deepEqual(list[1].collapsed, false);
		assert.deepEqual(list[1].depth, 2);
		assert.deepEqual(list[2].element, 11);
		assert.deepEqual(list[2].collapsed, false);
		assert.deepEqual(list[2].depth, 2);
		assert.deepEqual(list[3].element, 12);
		assert.deepEqual(list[3].collapsed, false);
		assert.deepEqual(list[3].depth, 2);
		assert.deepEqual(list[4].element, 1);
		assert.deepEqual(list[4].collapsed, false);
		assert.deepEqual(list[4].depth, 1);
		assert.deepEqual(list[5].element, 2);
		assert.deepEqual(list[5].collapsed, false);
		assert.deepEqual(list[5].depth, 1);
	}));

	test('deep insert collapsed', () => withSmartSplice(options => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1, options);

		model.splice([0], 0, [
			{
				element: 0, collapsed: true, children: [
					{ element: 10 },
					{ element: 11 },
					{ element: 12 },
				]
			},
			{ element: 1 },
			{ element: 2 }
		]);

		assert.deepEqual(list.length, 3);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsed, true);
		assert.deepEqual(list[0].depth, 1);
		assert.deepEqual(list[1].element, 1);
		assert.deepEqual(list[1].collapsed, false);
		assert.deepEqual(list[1].depth, 1);
		assert.deepEqual(list[2].element, 2);
		assert.deepEqual(list[2].collapsed, false);
		assert.deepEqual(list[2].depth, 1);
	}));

	test('delete', () => withSmartSplice(options => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1, options);

		model.splice([0], 0, [
			{ element: 0 },
			{ element: 1 },
			{ element: 2 }
		]);

		assert.deepEqual(list.length, 3);

		model.splice([1], 1);
		assert.deepEqual(list.length, 2);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[0].depth, 1);
		assert.deepEqual(list[1].element, 2);
		assert.deepEqual(list[1].collapsed, false);
		assert.deepEqual(list[1].depth, 1);

		model.splice([0], 2);
		assert.deepEqual(list.length, 0);
	}));

	test('nested delete', () => withSmartSplice(options => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1, options);

		model.splice([0], 0, [
			{
				element: 0, children: [
					{ element: 10 },
					{ element: 11 },
					{ element: 12 },
				]
			},
			{ element: 1 },
			{ element: 2 }
		]);

		assert.deepEqual(list.length, 6);

		model.splice([1], 2);
		assert.deepEqual(list.length, 4);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[0].depth, 1);
		assert.deepEqual(list[1].element, 10);
		assert.deepEqual(list[1].collapsed, false);
		assert.deepEqual(list[1].depth, 2);
		assert.deepEqual(list[2].element, 11);
		assert.deepEqual(list[2].collapsed, false);
		assert.deepEqual(list[2].depth, 2);
		assert.deepEqual(list[3].element, 12);
		assert.deepEqual(list[3].collapsed, false);
		assert.deepEqual(list[3].depth, 2);
	}));

	test('deep delete', () => withSmartSplice(options => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1, options);

		model.splice([0], 0, [
			{
				element: 0, children: [
					{ element: 10 },
					{ element: 11 },
					{ element: 12 },
				]
			},
			{ element: 1 },
			{ element: 2 }
		]);

		assert.deepEqual(list.length, 6);

		model.splice([0], 1);
		assert.deepEqual(list.length, 2);
		assert.deepEqual(list[0].element, 1);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[0].depth, 1);
		assert.deepEqual(list[1].element, 2);
		assert.deepEqual(list[1].collapsed, false);
		assert.deepEqual(list[1].depth, 1);
	}));

	test('hidden delete', () => withSmartSplice(options => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1, options);

		model.splice([0], 0, [
			{
				element: 0, collapsed: true, children: [
					{ element: 10 },
					{ element: 11 },
					{ element: 12 },
				]
			},
			{ element: 1 },
			{ element: 2 }
		]);

		assert.deepEqual(list.length, 3);

		model.splice([0, 1], 1);
		assert.deepEqual(list.length, 3);

		model.splice([0, 0], 2);
		assert.deepEqual(list.length, 3);
	}));

	test('collapse', () => withSmartSplice(options => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1, options);

		model.splice([0], 0, [
			{
				element: 0, children: [
					{ element: 10 },
					{ element: 11 },
					{ element: 12 },
				]
			},
			{ element: 1 },
			{ element: 2 }
		]);

		assert.deepEqual(list.length, 6);

		model.setCollapsed([0], true);
		assert.deepEqual(list.length, 3);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsed, true);
		assert.deepEqual(list[0].depth, 1);
		assert.deepEqual(list[1].element, 1);
		assert.deepEqual(list[1].collapsed, false);
		assert.deepEqual(list[1].depth, 1);
		assert.deepEqual(list[2].element, 2);
		assert.deepEqual(list[2].collapsed, false);
		assert.deepEqual(list[2].depth, 1);
	}));

	test('expand', () => withSmartSplice(options => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1, options);

		model.splice([0], 0, [
			{
				element: 0, collapsed: true, children: [
					{ element: 10 },
					{ element: 11 },
					{ element: 12 },
				]
			},
			{ element: 1 },
			{ element: 2 }
		]);

		assert.deepEqual(list.length, 3);

		model.setCollapsed([0], false);
		assert.deepEqual(list.length, 6);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[0].depth, 1);
		assert.deepEqual(list[1].element, 10);
		assert.deepEqual(list[1].collapsed, false);
		assert.deepEqual(list[1].depth, 2);
		assert.deepEqual(list[2].element, 11);
		assert.deepEqual(list[2].collapsed, false);
		assert.deepEqual(list[2].depth, 2);
		assert.deepEqual(list[3].element, 12);
		assert.deepEqual(list[3].collapsed, false);
		assert.deepEqual(list[3].depth, 2);
		assert.deepEqual(list[4].element, 1);
		assert.deepEqual(list[4].collapsed, false);
		assert.deepEqual(list[4].depth, 1);
		assert.deepEqual(list[5].element, 2);
		assert.deepEqual(list[5].collapsed, false);
		assert.deepEqual(list[5].depth, 1);
	}));

	test('smart diff consistency', () => {
		const times = 500;
		const minEdits = 1;
		const maxEdits = 10;
		const maxInserts = 5;

		for (let i = 0; i < times; i++) {
			const list: ITreeNode<number>[] = [];
			const model = new IndexTreeModel<number>('test', toList(list), -1, { diffIdentityProvider: { getId: n => String(n) } });

			const changes = [];
			const expected: number[] = [];
			let elementCounter = 0;

			for (let edits = Math.random() * (maxEdits - minEdits) + minEdits; edits > 0; edits--) {
				const spliceIndex = Math.floor(Math.random() * list.length);
				const deleteCount = Math.ceil(Math.random() * (list.length - spliceIndex));
				const insertCount = Math.floor(Math.random() * maxInserts + 1);

				let inserts: ITreeElement<number>[] = [];
				for (let i = 0; i < insertCount; i++) {
					const element = elementCounter++;
					inserts.push({ element, children: [] });
				}

				// move existing items
				if (Math.random() < 0.5) {
					const elements = list.slice(spliceIndex, spliceIndex + Math.floor(deleteCount / 2));
					inserts.push(...elements.map(({ element }) => ({ element, children: [] })));
				}

				model.splice([spliceIndex], deleteCount, inserts);
				expected.splice(spliceIndex, deleteCount, ...inserts.map(i => i.element));

				const listElements = list.map(l => l.element);
				changes.push(`splice(${spliceIndex}, ${deleteCount}, [${inserts.map(e => e.element).join(', ')}]) -> ${listElements.join(', ')}`);

				assert.deepStrictEqual(expected, listElements, `Expected ${listElements.join(', ')} to equal ${expected.join(', ')}. Steps:\n\n${changes.join('\n')}`);
			}
		}
	});

	test('collapse should recursively adjust visible count', () => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1);

		model.splice([0], 0, [
			{
				element: 1, children: [
					{
						element: 11, children: [
							{ element: 111 }
						]
					}
				]
			},
			{
				element: 2, children: [
					{ element: 21 }
				]
			}
		]);

		assert.deepEqual(list.length, 5);
		assert.deepEqual(toArray(list), [1, 11, 111, 2, 21]);

		model.setCollapsed([0, 0], true);
		assert.deepEqual(list.length, 4);
		assert.deepEqual(toArray(list), [1, 11, 2, 21]);

		model.setCollapsed([1], true);
		assert.deepEqual(list.length, 3);
		assert.deepEqual(toArray(list), [1, 11, 2]);
	});

	test('setCollapsible', () => {
		const list: ITreeNode<number>[] = [];
		const model = new IndexTreeModel<number>('test', toList(list), -1);

		model.splice([0], 0, [
			{
				element: 0, children: [
					{ element: 10 }
				]
			}
		]);

		assert.deepEqual(list.length, 2);

		model.setCollapsible([0], false);
		assert.deepEqual(list.length, 2);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsible, false);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[1].element, 10);
		assert.deepEqual(list[1].collapsible, false);
		assert.deepEqual(list[1].collapsed, false);

		assert.deepEqual(model.setCollapsed([0], true), false);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsible, false);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[1].element, 10);
		assert.deepEqual(list[1].collapsible, false);
		assert.deepEqual(list[1].collapsed, false);

		assert.deepEqual(model.setCollapsed([0], false), false);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsible, false);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[1].element, 10);
		assert.deepEqual(list[1].collapsible, false);
		assert.deepEqual(list[1].collapsed, false);

		model.setCollapsible([0], true);
		assert.deepEqual(list.length, 2);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsible, true);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[1].element, 10);
		assert.deepEqual(list[1].collapsible, false);
		assert.deepEqual(list[1].collapsed, false);

		assert.deepEqual(model.setCollapsed([0], true), true);
		assert.deepEqual(list.length, 1);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsible, true);
		assert.deepEqual(list[0].collapsed, true);

		assert.deepEqual(model.setCollapsed([0], false), true);
		assert.deepEqual(list[0].element, 0);
		assert.deepEqual(list[0].collapsible, true);
		assert.deepEqual(list[0].collapsed, false);
		assert.deepEqual(list[1].element, 10);
		assert.deepEqual(list[1].collapsible, false);
		assert.deepEqual(list[1].collapsed, false);
	});

	test('simple filter', () => {
		const list: ITreeNode<number>[] = [];
		const filter = new class implements ITreeFilter<number> {
			filter(element: number): TreeVisibility {
				return element % 2 === 0 ? TreeVisibility.Visible : TreeVisibility.Hidden;
			}
		};

		const model = new IndexTreeModel<number>('test', toList(list), -1, { filter });

		model.splice([0], 0, [
			{
				element: 0, children: [
					{ element: 1 },
					{ element: 2 },
					{ element: 3 },
					{ element: 4 },
					{ element: 5 },
					{ element: 6 },
					{ element: 7 }
				]
			}
		]);

		assert.deepEqual(list.length, 4);
		assert.deepEqual(toArray(list), [0, 2, 4, 6]);

		model.setCollapsed([0], true);
		assert.deepEqual(toArray(list), [0]);

		model.setCollapsed([0], false);
		assert.deepEqual(toArray(list), [0, 2, 4, 6]);
	});

	test('recursive filter on initial model', () => {
		const list: ITreeNode<number>[] = [];
		const filter = new class implements ITreeFilter<number> {
			filter(element: number): TreeVisibility {
				return element === 0 ? TreeVisibility.Recurse : TreeVisibility.Hidden;
			}
		};

		const model = new IndexTreeModel<number>('test', toList(list), -1, { filter });

		model.splice([0], 0, [
			{
				element: 0, children: [
					{ element: 1 },
					{ element: 2 }
				]
			}
		]);

		assert.deepEqual(toArray(list), []);
	});

	test('refilter', () => {
		const list: ITreeNode<number>[] = [];
		let shouldFilter = false;
		const filter = new class implements ITreeFilter<number> {
			filter(element: number): TreeVisibility {
				return (!shouldFilter || element % 2 === 0) ? TreeVisibility.Visible : TreeVisibility.Hidden;
			}
		};

		const model = new IndexTreeModel<number>('test', toList(list), -1, { filter });

		model.splice([0], 0, [
			{
				element: 0, children: [
					{ element: 1 },
					{ element: 2 },
					{ element: 3 },
					{ element: 4 },
					{ element: 5 },
					{ element: 6 },
					{ element: 7 }
				]
			},
		]);

		assert.deepEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);

		model.refilter();
		assert.deepEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);

		shouldFilter = true;
		model.refilter();
		assert.deepEqual(toArray(list), [0, 2, 4, 6]);

		shouldFilter = false;
		model.refilter();
		assert.deepEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);
	});

	test('recursive filter', () => {
		const list: ITreeNode<string>[] = [];
		let query = new RegExp('');
		const filter = new class implements ITreeFilter<string> {
			filter(element: string): TreeVisibility {
				return query.test(element) ? TreeVisibility.Visible : TreeVisibility.Recurse;
			}
		};

		const model = new IndexTreeModel<string>('test', toList(list), 'root', { filter });

		model.splice([0], 0, [
			{
				element: 'vscode', children: [
					{ element: '.build' },
					{ element: 'git' },
					{
						element: 'github', children: [
							{ element: 'calendar.yml' },
							{ element: 'endgame' },
							{ element: 'build.js' },
						]
					},
					{
						element: 'build', children: [
							{ element: 'lib' },
							{ element: 'gulpfile.js' }
						]
					}
				]
			},
		]);

		assert.deepEqual(list.length, 10);

		query = /build/;
		model.refilter();
		assert.deepEqual(toArray(list), ['vscode', '.build', 'github', 'build.js', 'build']);

		model.setCollapsed([0], true);
		assert.deepEqual(toArray(list), ['vscode']);

		model.setCollapsed([0], false);
		assert.deepEqual(toArray(list), ['vscode', '.build', 'github', 'build.js', 'build']);
	});

	test('recursive filter with collapse', () => {
		const list: ITreeNode<string>[] = [];
		let query = new RegExp('');
		const filter = new class implements ITreeFilter<string> {
			filter(element: string): TreeVisibility {
				return query.test(element) ? TreeVisibility.Visible : TreeVisibility.Recurse;
			}
		};

		const model = new IndexTreeModel<string>('test', toList(list), 'root', { filter });

		model.splice([0], 0, [
			{
				element: 'vscode', children: [
					{ element: '.build' },
					{ element: 'git' },
					{
						element: 'github', children: [
							{ element: 'calendar.yml' },
							{ element: 'endgame' },
							{ element: 'build.js' },
						]
					},
					{
						element: 'build', children: [
							{ element: 'lib' },
							{ element: 'gulpfile.js' }
						]
					}
				]
			},
		]);

		assert.deepEqual(list.length, 10);

		query = /gulp/;
		model.refilter();
		assert.deepEqual(toArray(list), ['vscode', 'build', 'gulpfile.js']);

		model.setCollapsed([0, 3], true);
		assert.deepEqual(toArray(list), ['vscode', 'build']);

		model.setCollapsed([0], true);
		assert.deepEqual(toArray(list), ['vscode']);
	});

	test('recursive filter while collapsed', () => {
		const list: ITreeNode<string>[] = [];
		let query = new RegExp('');
		const filter = new class implements ITreeFilter<string> {
			filter(element: string): TreeVisibility {
				return query.test(element) ? TreeVisibility.Visible : TreeVisibility.Recurse;
			}
		};

		const model = new IndexTreeModel<string>('test', toList(list), 'root', { filter });

		model.splice([0], 0, [
			{
				element: 'vscode', collapsed: true, children: [
					{ element: '.build' },
					{ element: 'git' },
					{
						element: 'github', children: [
							{ element: 'calendar.yml' },
							{ element: 'endgame' },
							{ element: 'build.js' },
						]
					},
					{
						element: 'build', children: [
							{ element: 'lib' },
							{ element: 'gulpfile.js' }
						]
					}
				]
			},
		]);

		assert.deepEqual(toArray(list), ['vscode']);

		query = /gulp/;
		model.refilter();
		assert.deepEqual(toArray(list), ['vscode']);

		model.setCollapsed([0], false);
		assert.deepEqual(toArray(list), ['vscode', 'build', 'gulpfile.js']);

		model.setCollapsed([0], true);
		assert.deepEqual(toArray(list), ['vscode']);

		query = new RegExp('');
		model.refilter();
		assert.deepEqual(toArray(list), ['vscode']);

		model.setCollapsed([0], false);
		assert.deepEqual(list.length, 10);
	});

	suite('getNodeLocation', () => {

		test('simple', () => {
			const list: IIndexTreeNode<number>[] = [];
			const model = new IndexTreeModel<number>('test', toList(list), -1);

			model.splice([0], 0, [
				{
					element: 0, children: [
						{ element: 10 },
						{ element: 11 },
						{ element: 12 },
					]
				},
				{ element: 1 },
				{ element: 2 }
			]);

			assert.deepEqual(model.getNodeLocation(list[0]), [0]);
			assert.deepEqual(model.getNodeLocation(list[1]), [0, 0]);
			assert.deepEqual(model.getNodeLocation(list[2]), [0, 1]);
			assert.deepEqual(model.getNodeLocation(list[3]), [0, 2]);
			assert.deepEqual(model.getNodeLocation(list[4]), [1]);
			assert.deepEqual(model.getNodeLocation(list[5]), [2]);
		});

		test('with filter', () => {
			const list: IIndexTreeNode<number>[] = [];
			const filter = new class implements ITreeFilter<number> {
				filter(element: number): TreeVisibility {
					return element % 2 === 0 ? TreeVisibility.Visible : TreeVisibility.Hidden;
				}
			};

			const model = new IndexTreeModel<number>('test', toList(list), -1, { filter });

			model.splice([0], 0, [
				{
					element: 0, children: [
						{ element: 1 },
						{ element: 2 },
						{ element: 3 },
						{ element: 4 },
						{ element: 5 },
						{ element: 6 },
						{ element: 7 }
					]
				}
			]);

			assert.deepEqual(model.getNodeLocation(list[0]), [0]);
			assert.deepEqual(model.getNodeLocation(list[1]), [0, 1]);
			assert.deepEqual(model.getNodeLocation(list[2]), [0, 3]);
			assert.deepEqual(model.getNodeLocation(list[3]), [0, 5]);
		});
	});

	test('refilter with filtered out nodes', () => {
		const list: ITreeNode<string>[] = [];
		let query = new RegExp('');
		const filter = new class implements ITreeFilter<string> {
			filter(element: string): boolean {
				return query.test(element);
			}
		};

		const model = new IndexTreeModel<string>('test', toList(list), 'root', { filter });

		model.splice([0], 0, [
			{ element: 'silver' },
			{ element: 'gold' },
			{ element: 'platinum' }
		]);

		assert.deepEqual(toArray(list), ['silver', 'gold', 'platinum']);

		query = /platinum/;
		model.refilter();
		assert.deepEqual(toArray(list), ['platinum']);

		model.splice([0], Number.POSITIVE_INFINITY, [
			{ element: 'silver' },
			{ element: 'gold' },
			{ element: 'platinum' }
		]);
		assert.deepEqual(toArray(list), ['platinum']);

		model.refilter();
		assert.deepEqual(toArray(list), ['platinum']);
	});

	test('explicit hidden nodes should have renderNodeCount == 0, issue #83211', () => {
		const list: ITreeNode<string>[] = [];
		let query = new RegExp('');
		const filter = new class implements ITreeFilter<string> {
			filter(element: string): boolean {
				return query.test(element);
			}
		};

		const model = new IndexTreeModel<string>('test', toList(list), 'root', { filter });

		model.splice([0], 0, [
			{ element: 'a', children: [{ element: 'aa' }] },
			{ element: 'b', children: [{ element: 'bb' }] }
		]);

		assert.deepEqual(toArray(list), ['a', 'aa', 'b', 'bb']);
		assert.deepEqual(model.getListIndex([0]), 0);
		assert.deepEqual(model.getListIndex([0, 0]), 1);
		assert.deepEqual(model.getListIndex([1]), 2);
		assert.deepEqual(model.getListIndex([1, 0]), 3);

		query = /b/;
		model.refilter();
		assert.deepEqual(toArray(list), ['b', 'bb']);
		assert.deepEqual(model.getListIndex([0]), -1);
		assert.deepEqual(model.getListIndex([0, 0]), -1);
		assert.deepEqual(model.getListIndex([1]), 0);
		assert.deepEqual(model.getListIndex([1, 0]), 1);
	});
});
