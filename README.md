# kevinj.in
Personal front page. Demonstration of responsive design and progressive enhancement. Compatible with IE8+, FF, Chrome. If you want to fork my website, all I ask is for you to note next to the copyright "Inspired by kevinj.in".

SSI is used in this project, so mod_include must be enabled in Apache. For Ubuntu users, this means running the command

	sudo a2enmod include

And then adding the following set of directives to /etc/apache2/sites-available/000-default.conf (adjusting /var/www/kevinj.in to the location of where you placed the home page files inside your DocumentRoot):

	<Directory /var/www/kevinj.in>
		Options +Indexes +FollowSymLinks +MultiViews +Includes
		AllowOverride None
		Order allow,deny
		allow from all
		AddType text/html .shtml
		AddOutputFilter INCLUDES .shtml
		DirectoryIndex index.html index.htm index.php index.shtml index.shtm
	</Directory>

And finally executing the command

	sudo /etc/init.d/apache2 restart
