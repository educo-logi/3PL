import base64
img = open('it_review.png', 'rb').read()
b64 = base64.b64encode(img).decode()
html = f'<html><body><img src="data:image/png;base64,{b64}" /></body></html>'
open('it_review_view.html', 'w').write(html)
print('Created')