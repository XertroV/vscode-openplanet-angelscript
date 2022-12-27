@include "angelscript.ne"

main -> _ array_expr_list _ {%
    function (d) { return d[1]; }
%}

# main -> _ {%
#     function (d) { return null; }
# %}
