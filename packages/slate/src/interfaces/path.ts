import { produce } from 'immer'
import { Operation } from '..'

/**
 * `Path` arrays are a list of indexes that describe a node's exact position in
 * a Slate node tree. Although they are usually relative to the root `Editor`
 * object, they can be relative to any `Node` object.
 */

export type Path = number[]

export const Path = {
  /**
   * Get a list of ancestor paths for a given path.
   *
   * The paths are sorted from shallowest to deepest shallowest ancestor. However, if the
   * `reverse: true` option is passed, they are reversed.
   */

  ancestors(path: Path, options: { reverse?: boolean } = {}): Path[] {
    const { reverse = false } = options
    let paths = Path.levels(path, options)

    if (reverse) {
      paths = paths.slice(1)
    } else {
      paths = paths.slice(0, -1)
    }

    return paths
  },

  /**
   * Get the common ancestor path of two paths.
   */

  common(path: Path, another: Path): Path {
    const common: Path = []

    for (let i = 0; i < path.length && i < another.length; i++) {
      const av = path[i]
      const bv = another[i]

      if (av !== bv) {
        break
      }

      common.push(av)
    }

    return common
  },

  /**
   * Compare a path to another, returning an integer indicating whether the path
   * was before, at, or after the other.
   *
   * Note: Two paths of unequal length can still receive a `0` result if one is
   * directly above or below the other. If you want exact matching, use
   * [[Path.equals]] instead.
   */

  compare(path: Path, another: Path): -1 | 0 | 1 {
    const min = Math.min(path.length, another.length)

    for (let i = 0; i < min; i++) {
      if (path[i] < another[i]) return -1
      if (path[i] > another[i]) return 1
    }

    return 0
  },

  /**
   * Check if a path ends after one of the indexes in another.
   */

  endsAfter(path: Path, another: Path): boolean {
    const i = path.length - 1
    const as = path.slice(0, i)
    const bs = another.slice(0, i)
    const av = path[i]
    const bv = another[i]
    return Path.equals(as, bs) && av > bv
  },

  /**
   * Check if a path ends at one of the indexes in another.
   */

  endsAt(path: Path, another: Path): boolean {
    const i = path.length
    const as = path.slice(0, i)
    const bs = another.slice(0, i)
    return Path.equals(as, bs)
  },

  /**
   * Check if a path ends before one of the indexes in another.
   */

  endsBefore(path: Path, another: Path): boolean {
    const i = path.length - 1
    const as = path.slice(0, i)
    const bs = another.slice(0, i)
    const av = path[i]
    const bv = another[i]
    return Path.equals(as, bs) && av < bv
  },

  /**
   * Check if a path is exactly equal to another.
   */

  equals(path: Path, another: Path): boolean {
    return (
      path.length === another.length && path.every((n, i) => n === another[i])
    )
  },

  /**
   * Check if a path is after another.
   */

  isAfter(path: Path, another: Path): boolean {
    return Path.compare(path, another) === 1
  },

  /**
   * Check if a path is an ancestor of another.
   */

  isAncestor(path: Path, another: Path): boolean {
    return path.length < another.length && Path.compare(path, another) === 0
  },

  /**
   * Check if a path is before another.
   */

  isBefore(path: Path, another: Path): boolean {
    return Path.compare(path, another) === -1
  },

  /**
   * Check if a path is a child of another.
   */

  isChild(path: Path, another: Path): boolean {
    return (
      path.length === another.length + 1 && Path.compare(path, another) === 0
    )
  },

  /**
   * Check if a path is equal to or an ancestor of another.
   */

  isCommon(path: Path, another: Path): boolean {
    return path.length <= another.length && Path.compare(path, another) === 0
  },

  /**
   * Check if a path is a descendant of another.
   */

  isDescendant(path: Path, another: Path): boolean {
    return path.length > another.length && Path.compare(path, another) === 0
  },

  /**
   * Check if a path is the parent of another.
   */

  isParent(path: Path, another: Path): boolean {
    return (
      path.length + 1 === another.length && Path.compare(path, another) === 0
    )
  },

  /**
   * Check is a value implements the `Path` interface.
   */

  isPath(value: any): value is Path {
    return (
      Array.isArray(value) &&
      (value.length === 0 || typeof value[0] === 'number')
    )
  },

  /**
   * Check if a path is a sibling of another.
   */

  isSibling(path: Path, another: Path): boolean {
    if (path.length !== another.length) {
      return false
    }

    const as = path.slice(0, -1)
    const bs = another.slice(0, -1)
    const al = path[path.length - 1]
    const bl = another[another.length - 1]
    return al !== bl && Path.equals(as, bs)
  },

  /**
   * Get a list of paths at every level down to a path. Note: this is the same
   * as `Path.ancestors`, but including the path itself.
   *
   * The paths are sorted from shallowest to deepest. However, if the `reverse:
   * true` option is passed, they are reversed.
   */

  levels(
    path: Path,
    options: {
      reverse?: boolean
    } = {}
  ): Path[] {
    const { reverse = false } = options
    const list: Path[] = []

    for (let i = 0; i <= path.length; i++) {
      list.push(path.slice(0, i))
    }

    if (reverse) {
      list.reverse()
    }

    return list
  },

  /**
   * Given a path, get the path to the next sibling node.
   */

  next(path: Path): Path {
    if (path.length === 0) {
      throw new Error(
        `Cannot get the next path of a root path [${path}], because it has no next index.`
      )
    }

    const last = path[path.length - 1]
    return path.slice(0, -1).concat(last + 1)
  },

  /**
   * Given a path, return a new path referring to the parent node above it.
   */

  parent(path: Path): Path {
    if (path.length === 0) {
      throw new Error(`Cannot get the parent path of the root path [${path}].`)
    }

    return path.slice(0, -1)
  },

  /**
   * Given a path, get the path to the previous sibling node.
   */

  previous(path: Path): Path {
    if (path.length === 0) {
      throw new Error(
        `Cannot get the previous path of a root path [${path}], because it has no previous index.`
      )
    }

    const last = path[path.length - 1]

    if (last <= 0) {
      throw new Error(
        `Cannot get the previous path of a first child path [${path}] because it would result in a negative index.`
      )
    }

    return path.slice(0, -1).concat(last - 1)
  },

  /**
   * Get a path relative to an ancestor.
   */

  relative(path: Path, ancestor: Path): Path {
    if (!Path.isAncestor(ancestor, path) && !Path.equals(path, ancestor)) {
      throw new Error(
        `Cannot get the relative path of [${path}] inside ancestor [${ancestor}], because it is not above or equal to the path.`
      )
    }

    return path.slice(ancestor.length)
  },

  /**
   * Transform a path by an operation.
   */

  transform(
    path: Path,
    operation: Operation,
    options: { affinity?: 'forward' | 'backward' | null } = {}
  ): Path | null {
    return produce(path, p => {
      const { affinity = 'forward' } = options

      // PERF: Exit early if the operation is guaranteed not to have an effect.
      if (path.length === 0) {
        return
      }
      // 从 p 中操作 op
      switch (operation.type) {
        case 'insert_node': {
          const { path: op } = operation
          // 插入一个 path， 插入的path必须是p的父级或者endsBefore
          // 只有在p之前的插入才会影响到p
          if (
            Path.equals(op, p) ||
            Path.endsBefore(op, p) ||
            Path.isAncestor(op, p)
          ) {
            p[op.length - 1] += 1
          }

          break
        }

        case 'remove_node': {
          const { path: op } = operation

          if (Path.equals(op, p) || Path.isAncestor(op, p)) {
            return null
          } else if (Path.endsBefore(op, p)) {
            p[op.length - 1] -= 1
          }

          break
        }

        case 'merge_node': {
          // to check: 这里的postion是何意？
          const { path: op, position } = operation

          if (Path.equals(op, p) || Path.endsBefore(op, p)) {
            p[op.length - 1] -= 1
          } else if (Path.isAncestor(op, p)) {
            // 这里感觉会有bug
            p[op.length - 1] -= 1
            p[op.length] += position
          }

          break
        }

        case 'split_node': {
          const { path: op, position } = operation

          if (Path.equals(op, p)) {
            if (affinity === 'forward') {
              p[p.length - 1] += 1
            } else if (affinity === 'backward') {
              // Nothing, because it still refers to the right path.
              // to check
            } else {
              return null
            }
          } else if (Path.endsBefore(op, p)) {
            p[op.length - 1] += 1
          } else if (Path.isAncestor(op, p) && path[op.length] >= position) {
            // to check: position是何意
            p[op.length - 1] += 1
            p[op.length] -= position
          }

          break
        }

        case 'move_node': {
          // 在p上 move op to onp
          const { path: op, newPath: onp } = operation

          // If the old and new path are the same, it's a no-op.
          if (Path.equals(op, onp)) {
            return
          }

          if (Path.isAncestor(op, p) || Path.equals(op, p)) {
            const copy = onp.slice()

            if (Path.endsBefore(op, onp) && op.length < onp.length) {
              const i = Math.min(onp.length, op.length) - 1
              copy[i] -= 1
            }
            // to check: 这里少考虑了一种情况，p 可能是endsBefore onp
            return copy.concat(p.slice(op.length))
          } else if (
            Path.endsBefore(onp, p) ||
            Path.equals(onp, p) ||
            Path.isAncestor(onp, p)
          ) {
            // to check: 这里少考虑了一种情况， op 可能是 onp的 ancestor
            if (Path.endsBefore(op, p)) {
              p[op.length - 1] -= 1
            }

            p[onp.length - 1] += 1
          } else if (Path.endsBefore(op, p)) {
            // to check: 这条语句不可能跑到
            if (Path.equals(onp, p)) {
              p[onp.length - 1] += 1
            }

            p[op.length - 1] -= 1
          }

          break
        }
      }
    })
  },
}
