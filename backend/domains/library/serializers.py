from rest_framework import serializers
from .models import User, Profile, Product

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ProfileSerializer(serializers.ModelSerializer):
    userId = serializers.PrimaryKeyRelatedField(source='user_id', queryset=User.objects.all())
    fullName = serializers.CharField(source='full_name', max_length=200)
    class Meta:
        model = Profile
        fields = ['id', 'userId', 'fullName', 'age']

class ProductSerializer(serializers.ModelSerializer):
    isAvailable = serializers.BooleanField(source='is_available')
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'isAvailable']
