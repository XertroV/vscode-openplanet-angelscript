@include "angelscript.ne"

main -> _ expr_inline_function _ {%
    function (d) { return d[1]; }
%}
main -> _ {%
    function (d) { return null; }
%}
