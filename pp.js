    const createSandbox = () => {
        const context = Object.create(global);
        const proxy = new Proxy(context, {
            set: (obj, prop, value) => {
                obj[prop] = value;
            },
            get: (obj, prop) => {
                return obj[prop];
            },
            has: () => {
                return true;
            }
        });
        return code => {
            Function(
                'proxy',
                `
                with(proxy) {
                    ;${code};
                }
            `
            )(proxy);
        };
    };

        // var a = 1;
        // var b = 2;
        // console.log(a, b);
        // outterVariable = 'sandbox';
        // console.log(outterVariable);

    const sandbox = createSandbox();
    sandbox(`
      something
      foo
      console.log(foo)
      foo = 10
      console.log(foo)
    `);

