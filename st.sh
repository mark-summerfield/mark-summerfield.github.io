if [ $# -ne 0 ]; then
    sitecheck .
else
    echo "use v to validate html pages"
fi
echo git st
git status
