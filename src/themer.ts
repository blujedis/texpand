import { twMerge } from 'tailwind-merge';

function create(name: string) {

  let values = [] as string[];
  let appends = [] as string[];

  const api = {
    add,
    append,
    compile
  };

  function add(value: Record<string, boolean>): typeof api;
  function add(value: string | string[], when: any): typeof api;
  function add(value: string | string[] | Record<string, boolean>, when?: any) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const k in value) {
        add(k, value[k])
      }
    }
    else if (when) {
      if (Array.isArray(value))
        values = [...values, ...value]
      else if (typeof value === 'string')
        values.push(value.trim());
    }
    return api;
  }

  function append(value: Record<string, boolean>): typeof api;
  function append(value: string | string[], when: any): typeof api;
  function append(value: string | string[] | Record<string, boolean>, when?: any) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const k in value) {
        append(k, value[k]);
      }
    }
    else if (when) {
      if (Array.isArray(value))
        appends = [...values, ...value]
      else if (typeof value === 'string')
        appends.push(value.trim());
    }
    return api;
  }

  function compile() {
    return twMerge(...values, ...appends);
  }

  return api;

}

function themer(name = '_default_') {
  return create(name);
}

themer.create = create;
themer.merge = twMerge;

export default themer;
