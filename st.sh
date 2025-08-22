if [ $# -ne 0 ]; then
    sitecheck . |grep -v \
	img.tag.has.nonexistent.src.https://static.fsf.org/nosvn/esp/logos/patent-free.svg
else
    echo "use v to validate html pages"
fi
echo git st
git status
