// auto x = SomeFunction(2, function(Arg@ arg1, Blah@ arg2, uint arg3) {
//     auto x = arg1;
//     print('arg2: ' + arg2);
// }, '3')
auto x = SomeFunction(2, function(Arg@ arg1, Blah@ arg2, uint arg3) {
    auto z = arg1;
    print('arg2: ' + arg2);
}, function(Arg@ arg1, Blah@ arg2, uint arg3) {
    auto y = arg1;
    print('arg3: ' + arg3);
}, '3')
