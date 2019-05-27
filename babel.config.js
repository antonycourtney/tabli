module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current'
                }
            }
        ],
        '@babel/preset-react',
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }]
    ]
};
