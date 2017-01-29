/* @flow */

import { CompositeDisposable } from 'sb-event-kit'
import Panel from './panel'
import Editors from './editors'
import TreeView from './tree-view'
import Commands from './commands'
import BusySignal from './busy-signal'
import Intentions from './intentions'
import { normalizeMessages } from './helpers'
import type { Linter, LinterMessage, MessagesPatch } from './types'

export default class LinterUI {
  name: string;
  panel: ?Panel;
  signal: BusySignal;
  editors: ?Editors;
  treeview: TreeView;
  commands: Commands;
  messages: Array<LinterMessage>;
  firstRender: boolean;
  intentions: Intentions;
  subscriptions: CompositeDisposable;

  constructor() {
    this.name = 'Linter'
    this.signal = new BusySignal()
    this.treeview = new TreeView()
    this.commands = new Commands()
    this.messages = []
    this.intentions = new Intentions()
    this.firstRender = true
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.signal)
    this.subscriptions.add(this.treeview)
    this.subscriptions.add(this.commands)

    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', (showPanel) => {
      if (showPanel && !this.panel) {
        this.panel = new Panel()
        this.panel.update(this.messages)
      } else if (!showPanel && this.panel) {
        this.panel.dispose()
        this.panel = null
      }
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showDecorations', (showDecorations) => {
      if (showDecorations && !this.editors) {
        this.editors = new Editors()
        this.editors.update({ added: this.messages, removed: [], messages: this.messages })
      } else if (!showDecorations && this.editors) {
        this.editors.dispose()
        this.editors = null
      }
    }))
  }
  render(difference: MessagesPatch) {
    this.messages = difference.messages
    if (this.firstRender) {
      normalizeMessages(difference.messages)
      this.firstRender = false
    } else {
      normalizeMessages(difference.added)
    }
    if (this.editors) {
      this.editors.update(difference)
    }
    if (this.panel) {
      this.panel.update(difference.messages)
    }
    this.commands.update(difference.messages)
    this.treeview.update(difference.messages)
  }
  didBeginLinting(linter: Linter, filePath: string) {
    this.signal.didBeginLinting(linter, filePath)
  }
  didFinishLinting(linter: Linter, filePath: string) {
    this.signal.didFinishLinting(linter, filePath)
  }
  dispose() {
    this.subscriptions.dispose()
    if (this.panel) {
      this.panel.dispose()
    }
    if (this.editors) {
      this.editors.dispose()
    }
  }
}
